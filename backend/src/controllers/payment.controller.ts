import { Request, Response, NextFunction } from 'express';
import { PrismaClient, PaymentStatus, PaymentMethod, OrderStatus } from '@prisma/client';
import { createError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import axios from 'axios';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Get Paystack secret key from API keys table
const getPaystackSecretKey = async (): Promise<string> => {
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      service: 'paystack',
      keyType: 'secret',
      isActive: true,
    },
  });

  if (!apiKey) {
    throw createError('Paystack not configured', 500);
  }

  // In production, decrypt the key
  return apiKey.value;
};

// Initialize payment
export const initializePayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { orderId, method } = req.body;

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order || order.buyerId !== userId) {
      throw createError('Order not found or unauthorized', 404);
    }

    if (order.payment && order.payment.status === PaymentStatus.COMPLETED) {
      throw createError('Order already paid', 400);
    }

    const secretKey = await getPaystackSecretKey();
    const reference = `AGR_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    // Prepare Paystack payload
    const payload: any = {
      email: user?.email || 'customer@agroconnect.com',
      amount: Math.round(parseFloat(order.totalAmount.toString()) * 100), // Convert to kobo/pesewas
      reference,
      callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
      metadata: {
        orderId,
        userId,
      },
    };

    // Add mobile money channel for Ghana
    if (method === PaymentMethod.MOBILE_MONEY_MTN) {
      payload.channels = ['mobile_money'];
      payload.mobile_money = {
        phone: req.body.phone,
        provider: 'mtn',
      };
    } else if (method === PaymentMethod.MOBILE_MONEY_VODAFONE) {
      payload.channels = ['mobile_money'];
      payload.mobile_money = {
        phone: req.body.phone,
        provider: 'vodafone',
      };
    } else if (method === PaymentMethod.MOBILE_MONEY_AIRTELTIGO) {
      payload.channels = ['mobile_money'];
      payload.mobile_money = {
        phone: req.body.phone,
        provider: 'tigo',
      };
    }

    // Call Paystack API
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      payload,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { authorization_url, access_code, reference: ref } = response.data.data;

    // Create or update payment record
    const payment = await prisma.payment.upsert({
      where: { orderId },
      create: {
        orderId,
        amount: order.totalAmount,
        status: PaymentStatus.PENDING,
        method: method as PaymentMethod,
        paystackRef: ref,
        paystackResponse: response.data,
      },
      update: {
        paystackRef: ref,
        paystackResponse: response.data,
        status: PaymentStatus.PENDING,
      },
    });

    res.json({
      success: true,
      data: {
        authorizationUrl: authorization_url,
        accessCode: access_code,
        reference: ref,
        payment,
      },
    });
  } catch (error: any) {
    if (error.response) {
      console.error('Paystack error:', error.response.data);
      throw createError(error.response.data.message || 'Payment initialization failed', 400);
    }
    next(error);
  }
};

// Verify payment
export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reference } = req.params;

    const secretKey = await getPaystackSecretKey();

    // Verify with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const { status, amount, reference: ref, metadata } = response.data.data;

    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { paystackRef: ref },
      include: { order: true },
    });

    if (!payment) {
      throw createError('Payment not found', 404);
    }

    // Update payment status
    const paymentStatus =
      status === 'success' ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        paystackResponse: response.data,
        ...(status === 'success' && { paidAt: new Date() }),
      },
    });

    // If successful, update order status
    if (status === 'success') {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.CONFIRMED },
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          paymentId: payment.id,
          type: 'charge',
          amount: payment.amount,
          reference: ref,
          status: 'success',
          metadata: response.data.data,
        },
      });

      // Notify seller
      await prisma.notification.create({
        data: {
          userId: payment.order.sellerId,
          type: 'PAYMENT',
          title: 'Payment Received',
          message: `Payment received for order ${payment.orderId}`,
          data: { orderId: payment.orderId, paymentId: payment.id },
        },
      });

      // Notify buyer
      await prisma.notification.create({
        data: {
          userId: payment.order.buyerId,
          type: 'PAYMENT',
          title: 'Payment Successful',
          message: `Your payment for order ${payment.orderId} was successful`,
          data: { orderId: payment.orderId, paymentId: payment.id },
        },
      });
    }

    res.json({
      success: true,
      data: {
        status: paymentStatus,
        payment,
      },
    });
  } catch (error: any) {
    if (error.response) {
      console.error('Paystack verification error:', error.response.data);
    }
    next(error);
  }
};

// Paystack webhook
export const paystackWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const secretKey = await getPaystackSecretKey();
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).send('Invalid signature');
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const { reference, status, amount } = event.data;

      const payment = await prisma.payment.findUnique({
        where: { paystackRef: reference },
        include: { order: true },
      });

      if (payment && status === 'success') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.COMPLETED,
            paidAt: new Date(),
            paystackResponse: event.data,
          },
        });

        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.CONFIRMED },
        });

        // Create transaction
        await prisma.transaction.create({
          data: {
            paymentId: payment.id,
            type: 'charge',
            amount: payment.amount,
            reference,
            status: 'success',
            metadata: event.data,
          },
        });

        // Send notifications (same as verifyPayment)
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    next(error);
  }
};

// Get payment history
export const getPaymentHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          order: {
            OR: [{ buyerId: userId }, { sellerId: userId }],
          },
        },
        skip,
        take: limitNum,
        include: {
          order: {
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
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({
        where: {
          order: {
            OR: [{ buyerId: userId }, { sellerId: userId }],
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        payments,
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
