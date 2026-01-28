import { Request, Response, NextFunction } from 'express';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { createError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { calculateDistance, calculateDeliveryFee } from '../utils/distance.util';

const prisma = new PrismaClient();

// Create order (Buyer)
export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { items, deliveryAddress, deliveryCity, deliveryRegion, deliveryLat, deliveryLng, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw createError('Order items required', 400);
    }

    // Validate items and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product || !product.isAvailable || product.quantity < item.quantity) {
        throw createError(`Product ${product?.title || item.productId} unavailable`, 400);
      }

      const itemTotal = parseFloat(product.price.toString()) * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Get seller ID from first item
    const firstProduct = await prisma.product.findUnique({
      where: { id: items[0].productId },
    });

    if (!firstProduct) {
      throw createError('Invalid product', 400);
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        buyerId: userId,
        sellerId: firstProduct.sellerId,
        status: OrderStatus.PENDING,
        totalAmount,
        deliveryAddress,
        deliveryCity,
        deliveryRegion,
        deliveryLat: deliveryLat ? parseFloat(deliveryLat) : null,
        deliveryLng: deliveryLng ? parseFloat(deliveryLng) : null,
        notes,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1 },
              },
            },
          },
        },
        seller: {
          include: { profile: true },
        },
        buyer: {
          include: { profile: true },
        },
      },
    });

    // Create notification for seller
    await prisma.notification.create({
      data: {
        userId: firstProduct.sellerId,
        type: 'ORDER',
        title: 'New Order Received',
        message: `You have a new order for ${orderItems.length} item(s)`,
        data: { orderId: order.id },
      },
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    next(error);
  }
};

// Get buyer's orders
export const getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { page = '1', limit = '20', status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      buyerId: userId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { take: 1 },
                },
              },
            },
          },
          seller: {
            include: { profile: true },
          },
          payment: true,
          delivery: true,
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

// Get seller's orders
export const getSellerOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { page = '1', limit = '20', status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      sellerId: userId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { take: 1 },
                },
              },
            },
          },
          buyer: {
            include: { profile: true },
          },
          payment: true,
          delivery: true,
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

// Get single order
export const getOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
        seller: {
          include: { profile: true },
        },
        buyer: {
          include: { profile: true },
        },
        payment: true,
        delivery: {
          include: {
            transporter: {
              include: {
                user: {
                  include: { profile: true },
                },
              },
            },
          },
        },
      },
    });

    if (!order || order.deletedAt) {
      throw createError('Order not found', 404);
    }

    // Verify access
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw createError('Unauthorized', 403);
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    next(error);
  }
};

// Update order status (Seller)
export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order || order.sellerId !== userId) {
      throw createError('Order not found or unauthorized', 404);
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: status as OrderStatus },
      include: {
        items: true,
        buyer: {
          include: { profile: true },
        },
      },
    });

    // Notify buyer
    await prisma.notification.create({
      data: {
        userId: order.buyerId,
        type: 'ORDER',
        title: 'Order Status Updated',
        message: `Your order status has been updated to ${status}`,
        data: { orderId: order.id, status },
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

// Cancel order (Buyer)
export const cancelOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!order || order.buyerId !== userId) {
      throw createError('Order not found or unauthorized', 404);
    }

    if (order.status === OrderStatus.DELIVERED) {
      throw createError('Cannot cancel delivered order', 400);
    }

    if (order.payment && order.payment.status === 'COMPLETED') {
      throw createError('Cannot cancel paid order. Please request refund.', 400);
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
    });

    // Notify seller
    await prisma.notification.create({
      data: {
        userId: order.sellerId,
        type: 'ORDER',
        title: 'Order Cancelled',
        message: `Order ${id} has been cancelled`,
        data: { orderId: order.id },
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
