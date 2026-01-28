import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/bcrypt.util';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util';
import { createError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import axios from 'axios';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Register new user
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, role, phoneNumber } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw createError('User already exists', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        profile: {
          create: {
            firstName,
            lastName,
            phoneNumber,
          },
        },
      },
      include: { profile: true },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: user.profile,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Login
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user || !user.password) {
      throw createError('Invalid credentials', 401);
    }

    // Check password
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      throw createError('Invalid credentials', 401);
    }

    // Check if active
    if (!user.isActive || user.isSuspended) {
      throw createError('Account is inactive or suspended', 403);
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: user.profile,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Google OAuth – verify id_token with Google, then find/create user
export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken, role: roleParam } = req.body;

    if (!idToken || typeof idToken !== 'string') {
      throw createError('Google id_token is required', 400);
    }

    // Verify id_token with Google tokeninfo API
    const tokenRes = await axios.get<{
      sub: string;
      email: string;
      email_verified?: string;
      given_name?: string;
      family_name?: string;
      name?: string;
      aud?: string;
    }>(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`).catch(() => null);

    if (!tokenRes?.data?.sub || !tokenRes.data.email) {
      throw createError('Invalid or expired Google token', 401);
    }

    const { sub, email, given_name, family_name } = tokenRes.data;
    const googleId = sub;
    const firstName = given_name || tokenRes.data.name?.split(' ')[0] || 'User';
    const lastName = family_name || tokenRes.data.name?.split(' ').slice(1).join(' ') || '';

    // Optional: verify audience matches our client ID
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId && tokenRes.data.aud && tokenRes.data.aud !== clientId) {
      throw createError('Invalid Google token audience', 401);
    }

    // Find by Google ID first (existing Google user)
    let user = await prisma.user.findUnique({
      where: { googleId },
      include: { profile: true },
    });

    if (user) {
      if (!user.isActive || user.isSuspended) {
        throw createError('Account is inactive or suspended', 403);
      }
      // Already linked; proceed to issue tokens
    } else {
      user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      });

      if (user) {
        if (user.googleId && user.googleId !== googleId) {
          throw createError('This email is linked to another Google account. Sign in with that account or use password.', 409);
        }
        // Link Google account
        await prisma.user.update({
          where: { id: user.id },
          data: { googleId, isVerified: true },
        });
        user = await prisma.user.findUnique({
          where: { id: user.id },
          include: { profile: true },
        })!;
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email,
            googleId,
            role: roleParam && ['FARMER', 'BUYER', 'TRANSPORTER', 'SUPPLIER'].includes(roleParam) ? roleParam : 'BUYER',
            isVerified: true,
            profile: {
              create: { firstName, lastName },
            },
          },
          include: { profile: true },
        });
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: user.profile,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      throw createError('Refresh token required', 400);
    }

    // Verify token
    const decoded = verifyRefreshToken(token);

    // Check if token exists in DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw createError('Invalid or expired refresh token', 401);
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true, isSuspended: true },
    });

    if (!user || !user.isActive || user.isSuspended) {
      throw createError('Invalid or inactive account', 401);
    }

    // Generate new tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Delete old token and create new one
    await prisma.refreshToken.delete({ where: { token } });
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Forgot password
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return res.json({ success: true, message: 'If user exists, reset email sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // In production, store token in DB and send email
    // For now, just return success

    res.json({
      success: true,
      message: 'If user exists, reset email sent',
      // In development, you might want to return the token
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
  } catch (error: any) {
    next(error);
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;

    // In production, verify token from DB
    // For now, simplified version

    const hashedPassword = await hashPassword(password);

    // Update user password (in production, verify token first)
    // This is a simplified version - implement proper token verification

    res.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error: any) {
    next(error);
  }
};

// Verify email
export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    // In production, verify token from DB
    // Simplified version for now

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error: any) {
    next(error);
  }
};
