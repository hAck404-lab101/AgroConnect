import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { uploadImage, deleteImage } from '../utils/cloudinary.util';
import { createError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import multer from 'multer';

const prisma = new PrismaClient();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Get all products (marketplace)
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1',
      limit = '20',
      category,
      search,
      minPrice,
      maxPrice,
      region,
      isAvailable,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      isApproved: true,
      deletedAt: null,
    };

    if (isAvailable === 'true' || isAvailable === undefined) {
      where.isAvailable = true;
    } else if (isAvailable === 'false') {
      where.isAvailable = false;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          seller: {
            include: { profile: true },
          },
          images: {
            orderBy: { order: 'asc' },
            take: 1,
          },
          categoryRef: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        products,
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

// Get single product
export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          include: { profile: true },
        },
        images: {
          orderBy: { order: 'asc' },
        },
        categoryRef: true,
      },
    });

    if (!product || product.deletedAt) {
      throw createError('Product not found', 404);
    }

    // Increment views
    await prisma.product.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    res.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    next(error);
  }
};

// Create product (Farmer)
export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { title, description, category, price, quantity, unit, categoryId } = req.body;

    const product = await prisma.product.create({
      data: {
        sellerId: userId,
        title,
        description,
        category,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        unit: unit || 'kg',
        categoryId: categoryId || null,
        isApproved: false, // Requires admin approval
      },
      include: {
        images: true,
        categoryRef: true,
      },
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    next(error);
  }
};

// Upload product images
export const uploadProductImages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { productId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw createError('No images provided', 400);
    }

    // Verify product ownership
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.sellerId !== userId) {
      throw createError('Product not found or unauthorized', 404);
    }

    // Upload images
    const uploadPromises = files.map(async (file, index) => {
      const result = await uploadImage(file, `agroconnect/products/${productId}`);
      return prisma.productImage.create({
        data: {
          productId,
          url: result.url,
          publicId: result.publicId || null,
          order: index,
        },
      });
    });

    const images = await Promise.all(uploadPromises);

    res.json({
      success: true,
      data: images,
    });
  } catch (error: any) {
    next(error);
  }
};

// Update product
export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { title, description, price, quantity, unit, isAvailable } = req.body;

    // Verify ownership
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product || product.sellerId !== userId) {
      throw createError('Product not found or unauthorized', 404);
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(quantity && { quantity: parseInt(quantity) }),
        ...(unit && { unit }),
        ...(isAvailable !== undefined && { isAvailable }),
      },
      include: {
        images: true,
        categoryRef: true,
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

// Delete product
export const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Verify ownership
    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!product || product.sellerId !== userId) {
      throw createError('Product not found or unauthorized', 404);
    }

    // Soft delete
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isAvailable: false },
    });

    // Delete images from Cloudinary
    for (const image of product.images) {
      if (image.publicId) {
        await deleteImage(image.publicId);
      }
    }

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

// Get farmer's products
export const getMyProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          sellerId: userId,
          deletedAt: null,
        },
        skip,
        take: limitNum,
        include: {
          images: {
            orderBy: { order: 'asc' },
            take: 1,
          },
          categoryRef: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({
        where: {
          sellerId: userId,
          deletedAt: null,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        products,
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

export { upload };
