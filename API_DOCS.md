# AgroConnect API Documentation

Complete API reference for AgroConnect backend.

## Base URL

```
Development: http://localhost:5000/api
Production: https://api.yourdomain.com/api
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### Authentication

#### Register
```
POST /auth/register
Body: {
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'FARMER' | 'BUYER' | 'TRANSPORTER' | 'SUPPLIER'
  phoneNumber?: string
}
Response: { user, accessToken, refreshToken }
```

#### Login
```
POST /auth/login
Body: { email: string, password: string }
Response: { user, accessToken, refreshToken }
```

#### Refresh Token
```
POST /auth/refresh
Body: { refreshToken: string }
Response: { accessToken, refreshToken }
```

### Products

#### Get Products (Public)
```
GET /products?page=1&limit=20&category=CROPS&search=maize&minPrice=10&maxPrice=100
Response: { products: [], pagination: {} }
```

#### Get Product (Public)
```
GET /products/:id
Response: { product }
```

#### Create Product (Farmer/Supplier)
```
POST /products
Headers: Authorization
Body: {
  title: string
  description: string
  category: 'CROPS' | 'LIVESTOCK' | 'INPUTS'
  price: number
  quantity: number
  unit: string
  categoryId?: string
}
Response: { product }
```

#### Upload Product Images
```
POST /products/:productId/images
Headers: Authorization
Body: FormData with 'images' field (max 5 files)
Response: { images: [] }
```

### Orders

#### Create Order (Buyer)
```
POST /orders
Headers: Authorization
Body: {
  items: [{ productId: string, quantity: number }]
  deliveryAddress: string
  deliveryCity: string
  deliveryRegion: string
  deliveryLat?: number
  deliveryLng?: number
  notes?: string
}
Response: { order }
```

#### Get My Orders (Buyer)
```
GET /orders/my-orders?page=1&limit=20&status=PENDING
Headers: Authorization
Response: { orders: [], pagination: {} }
```

#### Get Seller Orders
```
GET /orders/seller/my-orders?page=1&limit=20
Headers: Authorization
Response: { orders: [], pagination: {} }
```

#### Update Order Status (Seller)
```
PATCH /orders/:id/status
Headers: Authorization
Body: { status: 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' }
Response: { order }
```

### Payments

#### Initialize Payment
```
POST /payments/initialize
Headers: Authorization
Body: {
  orderId: string
  method: 'CARD' | 'MOBILE_MONEY_MTN' | 'MOBILE_MONEY_VODAFONE' | 'MOBILE_MONEY_AIRTELTIGO'
  phone?: string (for mobile money)
}
Response: { authorizationUrl, accessCode, reference, payment }
```

#### Verify Payment
```
GET /payments/verify/:reference
Response: { status, payment }
```

#### Paystack Webhook
```
POST /payments/webhook/paystack
Headers: X-Paystack-Signature
Body: Paystack webhook payload
```

### Chat

#### Get Conversations
```
GET /chat/conversations
Headers: Authorization
Response: { conversations: [] }
```

#### Get Messages
```
GET /chat/messages/:partnerId?page=1&limit=50
Headers: Authorization
Response: { messages: [], pagination: {} }
```

#### Send Message
```
POST /chat/send
Headers: Authorization
Body: {
  receiverId: string
  content?: string
  imageUrl?: string
}
Response: { message }
```

### Reviews

#### Create Review
```
POST /reviews
Headers: Authorization
Body: {
  revieweeId: string
  rating: number (1-5)
  comment?: string
  orderId?: string
}
Response: { review }
```

#### Get User Reviews
```
GET /reviews/user/:userId?page=1&limit=20
Response: { reviews: [], pagination: {} }
```

### Notifications

#### Get Notifications
```
GET /notifications?page=1&limit=20&unreadOnly=true
Headers: Authorization
Response: { notifications: [], unreadCount, pagination: {} }
```

#### Mark as Read
```
PATCH /notifications/:id/read
Headers: Authorization
Response: { notification }
```

### Admin

#### Get Analytics
```
GET /admin/analytics
Headers: Authorization (Admin only)
Response: { stats: {}, recentOrders: [], topProducts: [] }
```

#### Get API Keys
```
GET /admin/api-keys
Headers: Authorization (Admin only)
Response: { apiKeys: [] }
```

#### Create API Key
```
POST /admin/api-keys
Headers: Authorization (Admin only)
Body: {
  name: string
  service: string
  keyType: 'public' | 'secret' | 'api_key'
  value: string
  description?: string
}
Response: { apiKey }
```

## WebSocket Events

### Client → Server

- `send_message`: Send chat message
- `typing`: Typing indicator
- `mark_read`: Mark message as read

### Server → Client

- `new_message`: New message received
- `message_sent`: Message sent confirmation
- `message_read`: Message read receipt
- `user_typing`: User typing indicator
- `notification`: New notification

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

Status codes:
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

- Auth endpoints: 5 requests per 15 minutes
- API endpoints: 100 requests per 15 minutes
- Payment endpoints: 10 requests per hour

## Pagination

All list endpoints support pagination:

```
?page=1&limit=20
```

Response includes:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```
