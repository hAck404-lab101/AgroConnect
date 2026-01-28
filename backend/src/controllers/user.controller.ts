import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { uploadImage } from '../utils/cloudinary.util';
import multer from 'multer';

const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

// Get current user profile
export const getMyProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        transporter: {
          include: {
            vehicles: true,
          },
        },
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    next(error);
  }
};

// Update profile
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { firstName, lastName, phoneNumber, address, city, region, bio, latitude, longitude } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    const updated = await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        firstName: firstName || 'User',
        lastName: lastName || '',
        phoneNumber,
        address,
        city,
        region,
        bio,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      },
      update: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(region !== undefined && { region }),
        ...(bio !== undefined && { bio }),
        ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    next(error);
  }
};

// Upload avatar
export const uploadAvatar = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const file = req.file;

    if (!file) {
      throw createError('No image provided', 400);
    }

    const result = await uploadImage(file, `agroconnect/avatars/${userId}`);

    // Update profile
    const profile = await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        firstName: 'User',
        lastName: '',
        avatar: result.url,
      },
      update: {
        avatar: result.url,
      },
    });

    res.json({
      success: true,
      data: { avatar: result.url },
    });
  } catch (error: any) {
    next(error);
  }
};

// Get user by ID (public)
export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        transporter: {
          include: {
            vehicles: true,
          },
        },
        reviewsReceived: {
          where: { isApproved: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user || !user.isActive) {
      throw createError('User not found', 404);
    }

    // Calculate average rating
    const avgRating =
      user.reviewsReceived.length > 0
        ? user.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / user.reviewsReceived.length
        : 0;

    res.json({
      success: true,
      data: {
        ...user,
        averageRating: avgRating,
        totalReviews: user.reviewsReceived.length,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export { upload as uploadAvatarMulter };
