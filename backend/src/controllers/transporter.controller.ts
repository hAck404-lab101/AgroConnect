import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { calculateDistance, calculateDeliveryFee } from '../utils/distance.util';

const prisma = new PrismaClient();

// Create transporter profile
export const createTransporterProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { companyName, licenseNumber, basePrice } = req.body;

    // Check if already exists
    const existing = await prisma.transporter.findUnique({
      where: { userId },
    });

    if (existing) {
      throw createError('Transporter profile already exists', 400);
    }

    const transporter = await prisma.transporter.create({
      data: {
        userId,
        companyName,
        licenseNumber,
        basePrice: parseFloat(basePrice) || 2.0, // Default 2 GHS per km
      },
      include: {
        user: {
          include: { profile: true },
        },
        vehicles: true,
      },
    });

    res.status(201).json({
      success: true,
      data: transporter,
    });
  } catch (error: any) {
    next(error);
  }
};

// Get transporter profile
export const getTransporterProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;

    const transporter = await prisma.transporter.findUnique({
      where: { userId },
      include: {
        user: {
          include: { profile: true },
        },
        vehicles: true,
        deliveries: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!transporter) {
      throw createError('Transporter profile not found', 404);
    }

    res.json({
      success: true,
      data: transporter,
    });
  } catch (error: any) {
    next(error);
  }
};

// Add vehicle
export const addVehicle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { type, make, model, plateNumber, capacity } = req.body;

    const transporter = await prisma.transporter.findUnique({
      where: { userId },
    });

    if (!transporter) {
      throw createError('Transporter profile not found', 404);
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        transporterId: transporter.id,
        type,
        make,
        model,
        plateNumber,
        capacity: parseFloat(capacity),
      },
    });

    res.status(201).json({
      success: true,
      data: vehicle,
    });
  } catch (error: any) {
    next(error);
  }
};

// Get available transporters
export const getAvailableTransporters = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { lat, lng, distance = '50' } = req.query; // Default 50km radius

    const transporters = await prisma.transporter.findMany({
      where: {
        isVerified: true,
      },
      include: {
        user: {
          include: { profile: true },
        },
        vehicles: {
          where: { isActive: true },
        },
      },
    });

    // Filter by distance if coordinates provided
    let filtered = transporters;
    if (lat && lng) {
      filtered = transporters.filter((t) => {
        if (!t.user.profile?.latitude || !t.user.profile?.longitude) return false;
        const dist = calculateDistance(
          parseFloat(lat as string),
          parseFloat(lng as string),
          t.user.profile.latitude,
          t.user.profile.longitude
        );
        return dist <= parseFloat(distance as string);
      });
    }

    res.json({
      success: true,
      data: filtered,
    });
  } catch (error: any) {
    next(error);
  }
};

// Calculate delivery fee
export const calculateDeliveryFeeEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transporterId, originLat, originLng, destLat, destLng } = req.body;

    const transporter = await prisma.transporter.findUnique({
      where: { id: transporterId },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    if (!transporter) {
      throw createError('Transporter not found', 404);
    }

    if (!originLat || !originLng || !destLat || !destLng) {
      throw createError('Origin and destination coordinates required', 400);
    }

    const distance = calculateDistance(
      parseFloat(originLat),
      parseFloat(originLng),
      parseFloat(destLat),
      parseFloat(destLng)
    );

    const fee = calculateDeliveryFee(distance, parseFloat(transporter.basePrice.toString()));

    res.json({
      success: true,
      data: {
        distance: Math.round(distance * 100) / 100,
        fee: Math.round(fee * 100) / 100,
        basePricePerKm: parseFloat(transporter.basePrice.toString()),
      },
    });
  } catch (error: any) {
    next(error);
  }
};
