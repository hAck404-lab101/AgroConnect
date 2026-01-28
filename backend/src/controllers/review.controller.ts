import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Create review
export const createReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { revieweeId, orderId, rating, comment } = req.body;

    if (rating < 1 || rating > 5) {
      throw createError('Rating must be between 1 and 5', 400);
    }

    // Check if order exists and belongs to user
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order || order.buyerId !== userId) {
        throw createError('Order not found or unauthorized', 404);
      }

      // Check if review already exists for this order
      const existingReview = await prisma.review.findUnique({
        where: { orderId },
      });

      if (existingReview) {
        throw createError('Review already exists for this order', 400);
      }
    }

    const review = await prisma.review.create({
      data: {
        reviewerId: userId,
        revieweeId,
        orderId: orderId || null,
        rating,
        comment: comment || null,
        isApproved: false, // Requires admin approval
      },
      include: {
        reviewer: {
          include: { profile: true },
        },
        reviewee: {
          include: { profile: true },
        },
      },
    });

    // Update transporter rating if applicable
    const reviewee = await prisma.user.findUnique({
      where: { id: revieweeId },
      include: { transporter: true },
    });

    if (reviewee?.transporter) {
      const reviews = await prisma.review.findMany({
        where: {
          revieweeId,
          isApproved: true,
        },
      });

      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      await prisma.transporter.update({
        where: { userId: revieweeId },
        data: { rating: avgRating },
      });
    }

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error: any) {
    next(error);
  }
};

// Get reviews for a user
export const getUserReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          revieweeId: userId,
          isApproved: true,
        },
        skip,
        take: limitNum,
        include: {
          reviewer: {
            include: { profile: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({
        where: {
          revieweeId: userId,
          isApproved: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        reviews,
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
