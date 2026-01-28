# AgroConnect 2.0

A complete, production-ready full-stack platform connecting farmers, buyers, transporters, input suppliers, and admins in a digital agricultural ecosystem.

## 🏗️ Architecture

This is a monorepo containing:
- **Web App** (`apps/web`) - Next.js 14+ with App Router
- **Mobile App** (`apps/mobile`) - React Native with Expo
- **Backend API** (`backend`) - Express.js with TypeScript
- **Database** (`prisma`) - MySQL with Prisma ORM
- **Shared** (`shared`) - Shared types and utilities

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
   - Copy `.env.example` files in each directory
   - Configure MySQL, JWT secrets, Paystack keys, Google OAuth, Cloudinary, etc.

3. **Set up database:**
```bash
npm run prisma:generate
npm run prisma:migrate
```

4. **Run development servers:**
```bash
# Backend + Web (recommended)
npm run dev

# Or individually:
npm run dev:backend  # Backend API on http://localhost:5000
npm run dev:web      # Web app on http://localhost:3000
npm run dev:mobile   # Mobile app (Expo)
```

## 📁 Project Structure

```
/agroconnect
 ├── apps/
 │   ├── web/        → Next.js Web App
 │   ├── mobile/     → Expo Mobile App
 ├── backend/        → Express API
 ├── prisma/         → Prisma schema & migrations
 ├── shared/         → Shared types & utilities
 └── README.md
```

## 🔐 Authentication

- Email & Password
- Google OAuth 2.0
- JWT access & refresh tokens
- Role-based access control (RBAC)

## 💳 Payments

- Paystack integration
- Ghana Mobile Money (MTN, Vodafone, AirtelTigo)
- Web & Mobile support

## 📱 Features

### Basic
- User authentication & profiles
- Product listings (crops, livestock, inputs)
- Marketplace browsing
- Cart & orders
- Transporter profiles

### Intermediate
- Order lifecycle management
- Payment processing
- Real-time chat
- Reviews & ratings
- Notifications

### Advanced
- Market price intelligence
- Distance-based transport pricing
- Admin panel
- Analytics & reporting

## 🛠️ Tech Stack

- **Frontend (Web):** Next.js 14+, TypeScript, Tailwind CSS, ShadCN UI
- **Mobile:** React Native, Expo, TypeScript
- **Backend:** Node.js, Express.js, TypeScript, Socket.io
- **Database:** MySQL, Prisma ORM
- **Storage:** Cloudinary
- **Maps:** Google Maps API

## 📚 Documentation

- **[SETUP_AND_ACCESS.md](./SETUP_AND_ACCESS.md)** – How to set up the project and access the site as **admin** or **developer** (local dev, env vars, create-admin, admin dashboard).
- See individual README files in each directory for more detailed setup.

## 🔑 API Keys Management

All API keys and configuration are managed through the Admin Panel after initial setup.

## 📄 License

Proprietary - AgroConnect 2.0
