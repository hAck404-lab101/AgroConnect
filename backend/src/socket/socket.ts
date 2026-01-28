import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface SocketUser {
  userId: string;
  socketId: string;
}

const connectedUsers = new Map<string, string>(); // userId -> socketId

export const setupSocketIO = (io: Server, prismaClient: PrismaClient) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await prismaClient.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, isActive: true, isSuspended: true },
      });

      if (!user || !user.isActive || user.isSuspended) {
        return next(new Error('Invalid or inactive account'));
      }

      socket.data.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    connectedUsers.set(userId, socket.id);

    console.log(`User ${userId} connected: ${socket.id}`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle send message
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content, imageUrl } = data;

        // Create message in DB
        const message = await prismaClient.message.create({
          data: {
            senderId: userId,
            receiverId,
            content: content || '',
            imageUrl: imageUrl || null,
          },
          include: {
            sender: {
              include: { profile: true },
            },
            receiver: {
              include: { profile: true },
            },
          },
        });

        // Create notification
        await prismaClient.notification.create({
          data: {
            userId: receiverId,
            type: 'MESSAGE',
            title: 'New Message',
            message: `${message.sender.profile?.firstName || 'Someone'} sent you a message`,
            data: { messageId: message.id, senderId: userId },
          },
        });

        // Send to receiver if online
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('new_message', message);
          io.to(receiverSocketId).emit('notification', {
            type: 'MESSAGE',
            title: 'New Message',
            message: `${message.sender.profile?.firstName || 'Someone'} sent you a message`,
          });
        }

        // Confirm to sender
        socket.emit('message_sent', message);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { receiverId, isTyping } = data;
      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', {
          userId,
          isTyping,
        });
      }
    });

    // Handle read receipt
    socket.on('mark_read', async (data) => {
      try {
        const { messageId } = data;
        await prismaClient.message.update({
          where: { id: messageId },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });

        // Notify sender
        const message = await prismaClient.message.findUnique({
          where: { id: messageId },
        });

        if (message) {
          const senderSocketId = connectedUsers.get(message.senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit('message_read', { messageId });
          }
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
      console.log(`User ${userId} disconnected: ${socket.id}`);
    });
  });
};
