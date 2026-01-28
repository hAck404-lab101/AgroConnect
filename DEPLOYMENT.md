# AgroConnect Deployment Guide

Production deployment instructions for AgroConnect platform.

## Prerequisites

- Production server (VPS, AWS, Azure, etc.)
- Domain name
- SSL certificate
- MySQL database (managed or self-hosted)
- Cloudinary account
- Paystack account (production keys)

## Backend Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install MySQL (if not using managed DB)
sudo apt install mysql-server -y
```

### 2. Clone Repository

```bash
git clone <your-repo-url> /var/www/agroconnect
cd /var/www/agroconnect
npm install
```

### 3. Environment Configuration

```bash
cd backend
cp .env.example .env
nano .env
```

Production `.env`:

```env
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

DATABASE_URL="mysql://user:password@db-host:3306/agroconnect"

JWT_SECRET=<generate-strong-secret-32-chars-min>
JWT_REFRESH_SECRET=<generate-strong-secret-32-chars-min>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-key>
CLOUDINARY_API_SECRET=<your-secret>

FRONTEND_URL=https://yourdomain.com

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 4. Database Migration

```bash
cd prisma
npx prisma generate
npx prisma migrate deploy
```

### 5. Build Backend

```bash
cd backend
npm run build
```

### 6. Start with PM2

```bash
pm2 start dist/index.js --name agroconnect-api
pm2 save
pm2 startup
```

### 7. Setup Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 8. SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

## Web App Deployment

### Option 1: Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Set environment variables:
   - `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`
3. Deploy automatically on push

### Option 2: Self-Hosted

```bash
cd apps/web
npm run build
npm start
```

Or with PM2:

```bash
pm2 start npm --name agroconnect-web -- start
```

## Mobile App Deployment

### iOS

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Configure:
```bash
cd apps/mobile
eas build:configure
```

3. Build:
```bash
eas build --platform ios
```

4. Submit to App Store:
```bash
eas submit --platform ios
```

### Android

1. Build:
```bash
eas build --platform android
```

2. Submit to Play Store:
```bash
eas submit --platform android
```

## Environment Variables Summary

### Backend
- Database credentials
- JWT secrets
- Cloudinary credentials
- Paystack keys (via Admin Panel)
- SMTP settings

### Web
- `NEXT_PUBLIC_API_URL`

### Mobile
- `EXPO_PUBLIC_API_URL`

## Security Checklist

- [ ] Strong JWT secrets (32+ characters)
- [ ] HTTPS enabled everywhere
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Database backups configured
- [ ] Environment variables secured
- [ ] API keys managed via Admin Panel
- [ ] Regular security updates

## Monitoring

### PM2 Monitoring

```bash
pm2 monit
pm2 logs agroconnect-api
```

### Health Checks

```bash
curl https://api.yourdomain.com/health
```

## Backup Strategy

### Database Backup

```bash
# Daily backup script
mysqldump -u user -p agroconnect > backup-$(date +%Y%m%d).sql
```

### Automated Backups

Set up cron job:

```bash
0 2 * * * /path/to/backup-script.sh
```

## Scaling

### Horizontal Scaling

- Use load balancer (Nginx, AWS ALB)
- Multiple backend instances
- Database read replicas

### Vertical Scaling

- Increase server resources
- Optimize database queries
- Add caching (Redis)

## Support

For issues, check:
- Application logs: `pm2 logs`
- Nginx logs: `/var/log/nginx/`
- Database logs: MySQL error log
