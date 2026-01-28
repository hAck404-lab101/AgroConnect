# AgroConnect – Setup & Access (Admin / Developer)

This guide explains how to set up the project locally and access the site as an **admin** or **developer**.

---

## Prerequisites

- **Node.js** 18+
- **MySQL** 8.0+
- **npm** (or yarn)

---

## 1. Clone & Install

```bash
git clone <your-repo-url>
cd AgroConnect 2.0
npm install
```

Install all workspace dependencies (backend, web, mobile):

```bash
npm run install:all
```

---

## 2. Environment Variables

### Backend (`backend/.env`)

Create `backend/.env` (copy from `.env.example` if it exists, or use this template):

```env
# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:19006

# Database
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/agroconnect"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary (optional for uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# Google OAuth – used to verify id_token (optional; required for Google Sign-In)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

Replace `USER`, `PASSWORD`, and DB name as needed. Ensure the MySQL database `agroconnect` exists.

### Web App (`apps/web/.env.local`)

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
# Optional – for Google Sign-In
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## 3. Database Setup

1. Create the MySQL database:

   ```sql
   CREATE DATABASE agroconnect;
   ```

2. Generate Prisma client and run migrations:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

   Prisma uses `DATABASE_URL` from `backend/.env`. If you use the root-level `prisma:migrate` script, ensure `DATABASE_URL` is also in a `.env` at the project root, or run migrations from the backend:

   ```bash
   cd backend && npm run prisma:migrate
   ```

---

## 4. Run Development Servers

**Backend + Web (recommended):**

```bash
npm run dev
```

This starts:

- **Backend API:** [http://localhost:5000](http://localhost:5000)  
- **Web app:** [http://localhost:3000](http://localhost:3000)

**Run individually:**

```bash
npm run dev:backend   # API only
npm run dev:web       # Web app only
npm run dev:mobile    # Expo mobile app
```

---

## 5. Access as Developer

| Resource        | URL                          |
|----------------|------------------------------|
| **Web app**    | [http://localhost:3000](http://localhost:3000) |
| **API base**   | [http://localhost:5000/api](http://localhost:5000/api) |
| **Prisma Studio** | Run `npm run prisma:studio` → typically [http://localhost:5555](http://localhost:5555) |

- **Landing:** `/` – sign in / sign up (auth gate).  
- **Marketplace:** `/marketplace` – after login.  
- **Login / Register:** `/login`, `/register`.  
- **Product detail:** `/products/[id]`.  
- **Orders:** `/orders`.  
- **Switch role:** `/switch-role`.  
- **Dashboards:** `/{role}/dashboard` (e.g. `/farmer/dashboard`, `/admin/dashboard`).

---

## 6. Access as Admin

Admins use the **ADMIN** role. They cannot register via the UI (only FARMER, BUYER, TRANSPORTER, SUPPLIER can).

### 6.1 Create an Admin User

Ensure you've run `npm run prisma:generate` and `npm run prisma:migrate` first. Then, from the project root:

```bash
cd backend
npm run create-admin
```

This script:

- Creates a user with `role = ADMIN` if none exists for the configured email.  
- Uses `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `backend/.env` if set.  
- Otherwise uses defaults: **`admin@agroconnect.local`** / **`Admin123!`**

**Custom email/password:**

```bash
cd backend
ADMIN_EMAIL=admin@yourdomain.com ADMIN_PASSWORD=YourSecurePass npm run create-admin
```

If the user already exists, the script either confirms they are already admin or updates their role to `ADMIN`.

### 6.2 Log In as Admin

1. Open [http://localhost:3000/login](http://localhost:3000/login).  
2. Sign in with the admin email and password (e.g. `admin@agroconnect.local` / `Admin123!`).  
3. You are redirected to the marketplace.

### 6.3 Open the Admin Dashboard

- **Navbar:** Click **Dashboard** (your role is ADMIN, so it links to `/admin/dashboard`).  
- **Direct:** [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard).

The admin dashboard shows analytics, API keys, and links to:

- **Users** – `/admin/users`  
- **API Keys** – `/admin/api-keys`  
- **Orders** – `/admin/orders`  
- **Products** – `/admin/products`  

Only users with `role === 'ADMIN'` can access these. Others are redirected to `/login`.

---

## 7. Optional: Google Sign-In

1. Create a **Web application** OAuth client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).  
2. Set **Authorized JavaScript origins** (e.g. `http://localhost:3000`).  
3. Add the **Client ID** to:
   - **Web:** `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `apps/web/.env.local`  
   - **Backend:** `GOOGLE_CLIENT_ID` in `backend/.env` (for id_token verification)  
4. Restart the dev servers. The “Or continue with” Google button appears on `/login` and `/register`.

---

## 8. Quick Reference

| Task              | Command / Location                    |
|-------------------|----------------------------------------|
| Install deps      | `npm install` or `npm run install:all` |
| Generate Prisma   | `npm run prisma:generate`              |
| Run migrations    | `npm run prisma:migrate`               |
| Start dev         | `npm run dev`                          |
| Create admin      | `cd backend && npm run create-admin`   |
| Prisma Studio     | `npm run prisma:studio`                |
| Admin dashboard   | `/admin/dashboard` (after admin login) |

---

## 9. Troubleshooting

- **DB connection errors:** Check `DATABASE_URL` in `backend/.env`, MySQL is running, and the database exists.  
- **CORS errors:** Ensure `CORS_ORIGIN` in `backend/.env` includes your frontend origin (e.g. `http://localhost:3000`).  
- **Admin redirect to login:** Confirm the user has `role = 'ADMIN'` (e.g. via Prisma Studio or by re-running `create-admin`).  
- **Google Sign-In not showing:** Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `apps/web/.env.local` and restart the web app.
