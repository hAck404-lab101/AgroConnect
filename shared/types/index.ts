// Shared types between web and mobile apps

export interface User {
  id: string;
  email: string;
  role: 'FARMER' | 'BUYER' | 'TRANSPORTER' | 'SUPPLIER' | 'ADMIN';
  profile?: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    avatar?: string;
    address?: string;
    city?: string;
    region?: string;
  };
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: 'CROPS' | 'LIVESTOCK' | 'INPUTS';
  price: number;
  quantity: number;
  unit: string;
  images: Array<{ url: string; publicId?: string }>;
  seller: User;
  isAvailable: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  items: Array<{
    id: string;
    product: Product;
    quantity: number;
    price: number;
  }>;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryRegion: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  method: 'CARD' | 'MOBILE_MONEY_MTN' | 'MOBILE_MONEY_VODAFONE' | 'MOBILE_MONEY_AIRTELTIGO';
  paystackRef?: string;
  paidAt?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'ORDER' | 'PAYMENT' | 'MESSAGE' | 'SYSTEM';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
