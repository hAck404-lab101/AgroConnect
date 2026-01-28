import { Request, Response, NextFunction } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { createError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Get all users
export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '50', role, search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { profile: { firstName: { contains: search as string, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        include: { profile: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Update user role
export const updateUserRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.userId!;
    const { userId } = req.params;
    const { role } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw createError('User not found', 404);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: role as UserRole },
    });

    // Log action
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'UPDATE_USER_ROLE',
        entity: 'user',
        entityId: userId,
        details: { oldRole: user.role, newRole: role },
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

// Suspend/Unsuspend user
export const toggleUserSuspension = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.userId!;
    const { userId } = req.params;
    const { isSuspended } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw createError('User not found', 404);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isSuspended: isSuspended === true },
    });

    // Log action
    await prisma.adminLog.create({
      data: {
        adminId,
        action: isSuspended ? 'SUSPEND_USER' : 'UNSUSPEND_USER',
        entity: 'user',
        entityId: userId,
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

// Approve/Reject products
export const updateProductApproval = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.userId!;
    const { productId } = req.params;
    const { isApproved } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw createError('Product not found', 404);
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { isApproved: isApproved === true },
    });

    // Log action
    await prisma.adminLog.create({
      data: {
        adminId,
        action: isApproved ? 'APPROVE_PRODUCT' : 'REJECT_PRODUCT',
        entity: 'product',
        entityId: productId,
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

// Approve/Reject reviews
export const updateReviewApproval = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = req.userId!;
    const { reviewId } = req.params;
    const { isApproved } = req.body;

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw createError('Review not found', 404);
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { isApproved: isApproved === true },
    });

    // Log action
    await prisma.adminLog.create({
      data: {
        adminId,
        action: isApproved ? 'APPROVE_REVIEW' : 'REJECT_REVIEW',
        entity: 'review',
        entityId: reviewId,
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

// Get all orders
export const getAllOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '50', status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { deletedAt: null };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          buyer: { include: { profile: true } },
          seller: { include: { profile: true } },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Get analytics
export const getAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.product.count({ where: { deletedAt: null, isApproved: true } }),
      prisma.order.count({ where: { deletedAt: null } }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.order.findMany({
        take: 10,
        include: {
          buyer: { include: { profile: true } },
          seller: { include: { profile: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.findMany({
        where: { isApproved: true, deletedAt: null },
        take: 10,
        orderBy: { views: 'desc' },
        include: {
          images: { take: 1 },
          seller: { include: { profile: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalRevenue: totalRevenue._sum.amount || 0,
        },
        recentOrders,
        topProducts,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// API Key Management
export const getApiKeys = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Don't expose actual key values
    const sanitized = keys.map((key) => ({
      ...key,
      value: key.value.substring(0, 10) + '...', // Show only first 10 chars
    }));

    res.json({
      success: true,
      data: sanitized,
    });
  } catch (error: any) {
    next(error);
  }
};

export const createApiKey = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.userId!;
    const { name, service, keyType, value, description } = req.body;

    // In production, encrypt the value
    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        service,
        keyType,
        value, // Should be encrypted in production
        description,
        createdBy: adminId,
      },
    });

    // Log action
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'CREATE_API_KEY',
        entity: 'api_key',
        entityId: apiKey.id,
        details: { service, keyType },
      },
    });

    res.status(201).json({
      success: true,
      data: apiKey,
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateApiKey = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.userId!;
    const { id } = req.params;
    const { value, isActive, description } = req.body;

    const apiKey = await prisma.apiKey.findUnique({ where: { id } });
    if (!apiKey) {
      throw createError('API key not found', 404);
    }

    const updated = await prisma.apiKey.update({
      where: { id },
      data: {
        ...(value && { value }), // Should be encrypted
        ...(isActive !== undefined && { isActive }),
        ...(description !== undefined && { description }),
      },
    });

    // Log action
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'UPDATE_API_KEY',
        entity: 'api_key',
        entityId: id,
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

// Get admin logs
export const getAdminLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        skip,
        take: limitNum,
        include: {
          admin: {
            include: { profile: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.adminLog.count(),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};
