# AI Spend Guard API Documentation

## Overview
AI Spend Guard provides a comprehensive API for tracking and managing OpenAI ChatGPT API usage and spending. This documentation covers all available endpoints, authentication, and usage examples.

## Base URL
```
https://your-domain.com/api
```

## Authentication
All API endpoints require authentication using NextAuth session cookies or API keys.

### Session Authentication
For web applications, use NextAuth session cookies obtained through the authentication flow.

### API Key Authentication
For server-to-server communication, include your API key in the Authorization header:
```
Authorization: Bearer your-api-key
```

## Endpoints

### Authentication

#### GET /auth/session
Get current user session information.

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "subscriptionPlan": "Pro"
  }
}
```

### API Key Management

#### GET /api/keys
Get all API keys for the authenticated user.

**Response:**
```json
{
  "keys": [
    {
      "id": "key-id",
      "name": "My OpenAI Key",
      "provider": "openai",
      "status": "active",
      "projectId": "project-id",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/keys
Add a new API key.

**Request Body:**
```json
{
  "name": "My OpenAI Key",
  "provider": "openai",
  "apiKey": "sk-...",
  "projectId": "project-id"
}
```

**Response:**
```json
{
  "key": {
    "id": "key-id",
    "name": "My OpenAI Key",
    "provider": "openai",
    "status": "active",
    "projectId": "project-id",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT /api/keys/[id]
Update an existing API key.

**Request Body:**
```json
{
  "name": "Updated Key Name",
  "status": "active"
}
```

#### DELETE /api/keys/[id]
Delete an API key.

**Response:**
```json
{
  "message": "API key deleted successfully"
}
```

### Organization Management

#### GET /api/organizations
Get all organizations for the authenticated user.

**Response:**
```json
{
  "organizations": [
    {
      "id": "org-id",
      "name": "My Company",
      "description": "Company organization",
      "ownerId": "user-id",
      "projects": [
        {
          "id": "project-id",
          "name": "Web App",
          "description": "Main web application"
        }
      ],
      "members": [
        {
          "user": {
            "id": "user-id",
            "name": "John Doe",
            "email": "john@example.com"
          },
          "role": "OWNER"
        }
      ]
    }
  ]
}
```

#### POST /api/organizations
Create a new organization.

**Request Body:**
```json
{
  "name": "My Company",
  "description": "Company organization"
}
```

#### GET /api/organizations/[id]
Get organization details.

#### PUT /api/organizations/[id]
Update organization.

#### DELETE /api/organizations/[id]
Delete organization (owner only).

### Project Management

#### GET /api/projects
Get all projects for the authenticated user.

**Query Parameters:**
- `organizationId` (optional): Filter by organization

**Response:**
```json
{
  "projects": [
    {
      "id": "project-id",
      "name": "Web App",
      "description": "Main web application",
      "organizationId": "org-id",
      "organization": {
        "id": "org-id",
        "name": "My Company"
      },
      "apiKeys": [
        {
          "id": "key-id",
          "name": "Production Key",
          "provider": "openai",
          "status": "active"
        }
      ],
      "user": {
        "id": "user-id",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

#### POST /api/projects
Create a new project.

**Request Body:**
```json
{
  "name": "Web App",
  "description": "Main web application",
  "organizationId": "org-id"
}
```

#### GET /api/projects/[id]
Get project details.

#### PUT /api/projects/[id]
Update project.

#### DELETE /api/projects/[id]
Delete project.

### Usage Tracking

#### GET /api/usage
Get usage statistics for the authenticated user.

**Query Parameters:**
- `startDate` (optional): Start date for usage data (ISO 8601)
- `endDate` (optional): End date for usage data (ISO 8601)
- `apiKeyId` (optional): Filter by specific API key
- `projectId` (optional): Filter by specific project
- `organizationId` (optional): Filter by specific organization
- `groupBy` (optional): Group results by 'day', 'week', or 'month'

**Response:**
```json
{
  "usage": [
    {
      "date": "2024-01-01",
      "apiKeyId": "key-id",
      "provider": "openai",
      "endpoint": "chat/completions",
      "modelUsed": "gpt-4",
      "inputTokens": 1000,
      "outputTokens": 500,
      "totalTokens": 1500,
      "requests": 10,
      "cost": 0.045
    }
  ],
  "summary": {
    "totalCost": 0.045,
    "totalTokens": 1500,
    "totalRequests": 10
  }
}
```

#### GET /api/usage/summary
Get usage summary with projections.

**Response:**
```json
{
  "currentMonth": {
    "cost": 45.67,
    "tokens": 150000,
    "requests": 1000
  },
  "projectedMonth": {
    "cost": 89.34,
    "tokens": 300000,
    "requests": 2000
  },
  "dailyAverage": {
    "cost": 1.52,
    "tokens": 5000,
    "requests": 33
  }
}
```

### Budget Management

#### GET /api/budgets
Get all budgets for the authenticated user.

**Response:**
```json
{
  "budgets": [
    {
      "id": "budget-id",
      "name": "Monthly Budget",
      "amount": 100.00,
      "period": "MONTHLY",
      "scope": "USER",
      "isActive": true,
      "hardLimit": false,
      "apiKeyId": "key-id",
      "projectId": "project-id",
      "organizationId": "org-id"
    }
  ]
}
```

#### POST /api/budgets
Create a new budget.

**Request Body:**
```json
{
  "name": "Monthly Budget",
  "amount": 100.00,
  "period": "MONTHLY",
  "scope": "PROJECT",
  "hardLimit": false,
  "projectId": "project-id"
}
```

### Alert Management

#### GET /api/alerts
Get all alerts for the authenticated user.

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert-id",
      "name": "Monthly Budget Alert",
      "type": "cost",
      "threshold": 100.00,
      "period": "monthly",
      "isActive": true,
      "apiKeyId": "key-id",
      "projectId": "project-id",
      "organizationId": "org-id",
      "notificationChannels": [
        {
          "type": "EMAIL",
          "config": {
            "email": "user@example.com"
          }
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/alerts
Create a new alert.

**Request Body:**
```json
{
  "name": "Monthly Budget Alert",
  "type": "cost",
  "threshold": 100.00,
  "period": "monthly",
  "apiKeyId": "key-id",
  "projectId": "project-id",
  "notificationChannels": [
    {
      "type": "EMAIL",
      "config": {
        "email": "user@example.com"
      }
    },
    {
      "type": "SLACK",
      "config": {
        "webhookUrl": "https://hooks.slack.com/..."
      }
    }
  ]
}
```

#### PUT /api/alerts/[id]
Update an existing alert.

#### DELETE /api/alerts/[id]
Delete an alert.

### Billing

#### POST /api/billing/checkout
Create a Stripe checkout session for subscription upgrade.

**Request Body:**
```json
{
  "plan": "Pro"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_...",
  "plan": "Pro",
  "amount": 900
}
```

#### POST /api/billing/webhook
Stripe webhook endpoint for handling subscription events.

### Proxy

#### POST /api/proxy/openai
Proxy endpoint for OpenAI API calls with usage tracking and budget enforcement.

**Headers:**
- `X-API-Key`: Your registered API key ID
- `Content-Type`: application/json

**Request Body:**
Same as OpenAI API request body.

**Response:**
Same as OpenAI API response, with additional usage tracking.

**Budget Enforcement:**
If a hard budget limit is exceeded, the request will be blocked with a 429 status code.

### Health Check

#### GET /api/health
Get system health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "responseTime": 45,
  "services": {
    "database": {
      "status": "healthy",
      "latency": 12
    },
    "backgroundJobs": {
      "status": "healthy",
      "details": {
        "lastUsageAge": 3600000,
        "activeJobs": 4,
        "databaseConnected": true
      }
    },
    "circuitBreakers": {
      "openai": {
        "state": "CLOSED",
        "failureCount": 0,
        "lastFailureTime": null
      },
      "stripe": {
        "state": "CLOSED",
        "failureCount": 0,
        "lastFailureTime": null
      },
      "notifications": {
        "state": "CLOSED",
        "failureCount": 0,
        "lastFailureTime": null
      }
    },
    "dataFreshness": {
      "status": "healthy"
    }
  },
  "version": "1.0.0",
  "environment": "production"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

Common HTTP status codes:
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded or budget limit reached
- `500`: Internal Server Error - Server error
- `503`: Service Unavailable - Circuit breaker open or system unhealthy

## Rate Limits

API endpoints are rate limited based on your subscription plan:

- **Free**: 100 requests per hour
- **Pro**: 1,000 requests per hour
- **Team**: 5,000 requests per hour
- **Advanced**: 10,000 requests per hour

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Request limit per hour
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when rate limit resets (Unix timestamp)

## Subscription Plans

### Free Plan
- 1 API key
- $10/month spend limit
- 7 days usage history
- Email alerts only
- Basic support

### Pro Plan ($9/month)
- 5 API keys
- $100/month spend limit
- 30 days usage history
- Email + Slack alerts
- Priority support

### Team Plan ($29/month)
- 20 API keys
- $500/month spend limit
- 90 days usage history
- All notification channels
- Organizations and projects
- Team collaboration
- Priority support

### Advanced Plan ($99/month)
- Unlimited API keys
- Unlimited spend
- 1 year usage history
- All notification channels
- Organizations and projects
- Advanced analytics
- Custom integrations
- Dedicated support

## Webhooks

AI Spend Guard supports webhooks for real-time notifications:

### Webhook Events
- `usage.threshold_exceeded`: When usage exceeds alert threshold
- `budget.limit_reached`: When budget limit is reached
- `billing.payment_succeeded`: When subscription payment succeeds
- `billing.payment_failed`: When subscription payment fails

### Webhook Payload
```json
{
  "event": "usage.threshold_exceeded",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "userId": "user-id",
    "alertId": "alert-id",
    "threshold": 100.00,
    "currentUsage": 105.50,
    "projectId": "project-id",
    "organizationId": "org-id"
  }
}
```

## SDKs

### JavaScript/TypeScript SDK
```bash
npm install @ai-spend-guard/sdk
```

```javascript
import { AISpendGuard } from '@ai-spend-guard/sdk';

const client = new AISpendGuard({
  apiKey: 'your-api-key',
  baseUrl: 'https://your-domain.com'
});

// Proxy OpenAI request with automatic usage tracking
const response = await client.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }]
});

// Get usage statistics
const usage = await client.usage.get({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  projectId: 'project-123'
});

// Create budget
const budget = await client.budgets.create({
  name: 'Monthly Budget',
  amount: 100.00,
  period: 'MONTHLY',
  scope: 'PROJECT',
  projectId: 'project-123'
});
```

## Examples

### Track Usage for Specific Project
```javascript
const usage = await fetch('/api/usage?projectId=project-123&startDate=2024-01-01', {
  headers: {
    'Authorization': 'Bearer your-session-token'
  }
});
```

### Create Organization Budget Alert
```javascript
const alert = await fetch('/api/alerts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-session-token'
  },
  body: JSON.stringify({
    name: 'Organization Budget Alert',
    type: 'cost',
    threshold: 500.00,
    period: 'monthly',
    organizationId: 'org-123',
    notificationChannels: [
      {
        type: 'EMAIL',
        config: { email: 'admin@company.com' }
      },
      {
        type: 'SLACK',
        config: { webhookUrl: 'https://hooks.slack.com/...' }
      }
    ]
  })
});
```

### Proxy OpenAI Request with Budget Enforcement
```javascript
const response = await fetch('/api/proxy/openai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'key-123'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});

// Response includes usage tracking and budget enforcement
if (response.status === 429) {
  console.log('Budget limit exceeded - request blocked');
}
