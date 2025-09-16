# SpendlyAI API Documentation

## Overview
This document describes the Fast CRUD API Routes for SpendlyAI. All routes require authentication and include input validation to prevent security vulnerabilities.

## Authentication
All API routes use NextAuth.js session-based authentication. Users must be signed in to access any endpoint.

## Base URL
```
http://localhost:3001/api
```

## Endpoints

### User Management

#### GET /api/user/me
Retrieve the current user's profile and subscription plan.

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "subscriptionPlan": "Free",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### API Key Management

#### GET /api/keys
Fetch all API keys for the authenticated user. **Note:** Encrypted keys are never returned.

**Response:**
```json
{
  "apiKeys": [
    {
      "id": "key_id",
      "provider": "OpenAI",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### DELETE /api/keys/:id
Delete an API key and all associated usage data.

**Parameters:**
- `id` (string): The API key ID

**Response:**
```json
{
  "message": "API key deleted successfully",
  "deletedKeyId": "key_id"
}
```

### Alerts

#### POST /api/alerts/threshold
Create or update an alert threshold for the user.

**Request Body:**
```json
{
  "threshold": 100.0,
  "type": "email"
}
```

**Validation:**
- `threshold`: Number between 0 and 10000
- `type`: Must be either "email" or "slack"

**Response:**
```json
{
  "id": "alert_id",
  "threshold": 100.0,
  "type": "email",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Dashboard

#### GET /api/dashboard/usage-summary
Get aggregated usage summary for the current month and recent trends.

**Response:**
```json
{
  "currentMonth": {
    "totalCost": 247.83,
    "totalTokens": 150000,
    "totalRequests": 1250,
    "mostExpensiveEndpoint": "gpt-4",
    "highestSingleCost": 15.50
  },
  "recentTrend": [
    {
      "date": "2024-01-01T00:00:00.000Z",
      "cost": 12.50,
      "tokens": 5000
    }
  ],
  "period": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-01-31T23:59:59.999Z"
  }
}
```

### Billing

#### POST /api/billing/checkout
Create a Stripe checkout session for subscription upgrade.

**Request Body:**
```json
{
  "plan": "Pro"
}
```

**Validation:**
- `plan`: Must be either "Pro" or "Team"

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_session_id",
  "plan": "Pro",
  "amount": 1500
}
```

#### POST /api/billing/portal
Create a Stripe customer portal session for subscription management.

**Response:**
```json
{
  "portalUrl": "https://billing.stripe.com/...",
  "customerId": "cus_customer_id"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error

## Security Features

1. **Authentication**: All routes verify user session
2. **Input Validation**: Request bodies validated with Zod schemas
3. **Data Protection**: Encrypted API keys never returned to frontend
4. **User Isolation**: Users can only access their own data
5. **SQL Injection Prevention**: Prisma ORM with parameterized queries

## Environment Variables Required

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret"
GITHUB_ID="github-oauth-id"
GITHUB_SECRET="github-oauth-secret"
GOOGLE_CLIENT_ID="google-oauth-id"
GOOGLE_CLIENT_SECRET="google-oauth-secret"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_TEAM_PRICE_ID="price_..."
```
