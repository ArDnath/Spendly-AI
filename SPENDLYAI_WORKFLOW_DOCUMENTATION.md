# SpendlyAI - Complete Application Workflow Documentation

## Overview

SpendlyAI is a comprehensive "Mint for API tokens" application that tracks, visualizes, and manages AI API usage costs. The application provides real-time monitoring, budget alerts, and optimization recommendations for AI service spending.

## Architecture

### Technology Stack
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes with Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (GitHub & Google OAuth)
- **State Management**: Zustand
- **Charts**: Recharts
- **Build System**: Turborepo (Monorepo)
- **Styling**: Tailwind CSS with dark theme
- **Icons**: Lucide React

### Project Structure
```
spendlyAI/
├── apps/
│   └── web/                    # Next.js frontend application
│       ├── app/               # App router pages and API routes
│       ├── components/        # React components
│       ├── hooks/            # Custom React hooks
│       ├── lib/              # Utility functions and services
│       └── stores/           # Zustand state stores
├── packages/
│   ├── database/             # Prisma schema and database utilities
│   ├── eslint-config/        # Shared ESLint configuration
│   ├── tailwind-config/      # Shared Tailwind configuration
│   ├── typescript-config/    # Shared TypeScript configuration
│   └── ui/                   # Shared UI components
└── Configuration files (turbo.json, package.json, etc.)
```

## Core Features

### 1. User Authentication
- **Implementation**: NextAuth.js with OAuth providers (GitHub, Google)
- **Flow**: 
  1. User visits landing page
  2. Clicks "Start Free Audit" → redirects to `/auth/signin` if not authenticated
  3. Chooses OAuth provider
  4. Redirected to dashboard upon successful authentication
- **Session Management**: Server-side sessions with automatic user creation

### 2. API Key Management
- **Security**: API keys encrypted at rest using AES encryption
- **CRUD Operations**: Full create, read, update, delete functionality
- **Providers Supported**: OpenAI (extensible to other providers)
- **Storage**: Encrypted in PostgreSQL `ApiKey` table
- **UI**: Modal-based management with provider icons and status indicators

### 3. Usage Data Collection
- **Automated Fetching**: CRON jobs fetch daily usage from OpenAI API
- **Data Processing**: 
  - Fetches usage from OpenAI's billing API
  - Processes daily costs and line items
  - Estimates token usage based on cost
  - Stores aggregated data in `Usage` table
- **Manual Sync**: API endpoint for on-demand synchronization
- **Rate Limiting**: Respects API rate limits with delays between requests

### 5. Dashboard & Analytics
- **Real-time Updates**: Auto-refresh every 30 seconds (toggleable)
- **Key Metrics**:
  - Total monthly spend
  - Budget utilization percentage
  - Token usage (input/output/total)
  - Request counts
  - Most expensive endpoints
- **Visualizations**:
  - Usage trend charts (area charts with dual Y-axis)
  - Provider breakdown (pie charts)
  - Cost trends over time
  - Budget progress indicators

### 5. Alert System
- **Threshold Types**: Cost, tokens, requests
- **Periods**: Daily, weekly, monthly
- **Notification Methods**: Email, Slack webhooks, custom webhooks
- **Features**:
  - Configurable thresholds per API key or global
  - Rate limiting (max 1 notification per hour per alert)
  - Rich email templates with HTML/text versions
  - Slack integration with formatted messages
  - Custom webhook payloads for integrations

### 6. Budget Management
- **Budget Tracking**: Visual progress bars and percentage calculations
- **Overspend Alerts**: Automatic warnings at 90% budget utilization
- **Projections**: Estimated monthly spend based on current usage
- **Recommendations**: Cost optimization suggestions

## Database Schema

### User Table
```sql
- id: String (CUID)
- email: String (unique)
- name: String?
- subscriptionPlan: String (default: "Free")
- subscriptionEnd: DateTime
- createdAt: DateTime
- updatedAt: DateTime
```

### ApiKey Table
```sql
- id: String (CUID)
- userId: String (FK)
- encryptedKey: String
- provider: String
- name: String
- description: String?
- status: String (default: "active")
- createdAt: DateTime
- updatedAt: DateTime
```

### Usage Table
```sql
- id: String (CUID)
- apiKeyId: String (FK)
- provider: String
- endpoint: String
- modelUsed: String?
- inputTokens: Int
- outputTokens: Int
- totalTokens: Int
- requests: Int
- cost: Float
- mostExpensiveEndpoint: String?
- date: DateTime
- createdAt: DateTime
```

### Alert Table
```sql
- id: String (CUID)
- userId: String (FK)
- name: String
- threshold: Int
- thresholdType: String (cost/tokens/requests)
- period: String (daily/weekly/monthly)
- notificationMethod: String
- isActive: Boolean
- apiKeyId: String? (FK, optional)
- lastNotificationSentAt: DateTime?
- createdAt: DateTime
- updatedAt: DateTime
```

## API Endpoints

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js authentication handlers

### API Key Management
- `GET /api/keys` - List user's API keys (encrypted keys never returned)
- `POST /api/keys` - Create new API key
- `DELETE /api/keys/:id` - Delete API key

### Usage & Analytics
- `GET /api/dashboard/usage-summary` - Current month usage summary
- `GET /api/analytics/usage` - Advanced usage analytics with filtering
- `POST /api/usage/sync` - Manual usage data synchronization

### Alerts
- `GET /api/alerts` - List user's alerts
- `POST /api/alerts` - Create new alert
- `PUT /api/alerts/:id` - Update alert
- `DELETE /api/alerts/:id` - Delete alert

### System
- `GET /api/cron/status` - CRON job status monitoring
- `GET /api/user/me` - User profile information

## Application Workflow

### 1. User Onboarding
```
Landing Page → Authentication → Dashboard → Add API Key → Start Monitoring
```

### 2. Daily Operations
```
CRON Job (2 AM) → Fetch OpenAI Usage → Process & Store Data → Check Alerts → Send Notifications
```

### 3. User Interaction Flow
```
Dashboard View → Real-time Updates → Alert Configuration → Budget Monitoring → Cost Optimization
```

### 4. Alert Processing
```
Usage Threshold Exceeded → Alert Triggered → Notification Sent → Cooldown Period → Ready for Next Alert
```

## CRON Job System

### Scheduler Implementation
- **Custom Scheduler**: Built-in TypeScript CRON scheduler
- **Job Types**:
  - Daily usage fetch (2 AM)
  - Hourly alert checks
  - Development: 30-minute sync (dev mode only)
- **Error Handling**: Individual job failures don't stop other jobs
- **Monitoring**: Status API for job health checks

### Usage Data Fetching Process
1. **Retrieve Active API Keys**: Query all active OpenAI API keys
2. **Decrypt Keys**: Safely decrypt stored API keys
3. **Fetch Usage**: Call OpenAI billing API for each key
4. **Process Data**: Parse response, estimate tokens, calculate costs
5. **Store Results**: Upsert usage records in database
6. **Rate Limiting**: 1-second delay between API calls

### Alert Processing
1. **Query Active Alerts**: Get all enabled alerts
2. **Calculate Periods**: Determine date ranges (daily/weekly/monthly)
3. **Aggregate Usage**: Sum usage data for each alert's criteria
4. **Check Thresholds**: Compare current usage vs. thresholds
5. **Send Notifications**: Email/Slack/webhook notifications
6. **Update Records**: Track last notification timestamps

## State Management

### Zustand Stores
- **UI Store**: Mobile menu state, modals
- **Dashboard Store**: API keys, alerts, usage data, user profile
- **Auth Store**: Authentication provider state

### Data Flow
```
API Call → Store Update → Component Re-render → UI Update
```

## Security Features

### API Key Protection
- **Encryption**: AES encryption for stored API keys
- **Access Control**: User isolation, ownership verification
- **Never Exposed**: Encrypted keys never returned to frontend
- **Secure Transmission**: HTTPS only, secure headers

### Authentication & Authorization
- **OAuth Only**: No password storage, OAuth providers only
- **Session-based**: Secure server-side sessions
- **Route Protection**: Middleware authentication on all API routes
- **CSRF Protection**: Built-in NextAuth.js CSRF protection

### Data Privacy
- **User Isolation**: All data scoped to authenticated user
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **Input Validation**: Zod schema validation on all inputs
- **Error Handling**: No sensitive data in error messages

## Performance Optimizations

### Frontend
- **Real-time Updates**: Configurable auto-refresh (30s default)
- **Loading States**: Skeleton loading, loading overlays
- **Error Boundaries**: Graceful error handling and recovery
- **Responsive Design**: Mobile-first, progressive enhancement

### Backend
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Prisma connection pooling
- **Caching**: Turborepo build caching
- **Rate Limiting**: API rate limiting for external calls

### Data Processing
- **Batch Operations**: Bulk database operations where possible
- **Incremental Updates**: Only fetch new/changed data
- **Aggregation**: Pre-calculated summaries and trends
- **Efficient Queries**: Optimized Prisma queries with select/include

## Deployment & Environment

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://...

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Encryption
ENCRYPTION_KEY=your-32-character-key

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@spendly.ai

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### Deployment Steps
1. **Database Setup**: PostgreSQL instance with connection string
2. **Environment Configuration**: Set all required environment variables
3. **Database Migration**: Run `pnpm db:deploy`
4. **Build Application**: Run `pnpm build`
5. **Start Services**: Deploy to Vercel/Railway/similar platform
6. **Initialize CRON**: Ensure CRON jobs start automatically

## Monitoring & Maintenance

### Health Checks
- **API Endpoints**: All routes include error handling and logging
- **Database**: Connection health monitoring
- **CRON Jobs**: Status API for job monitoring
- **External APIs**: OpenAI API availability checks

### Logging
- **Structured Logging**: Console.log with timestamps and context
- **Error Tracking**: Comprehensive error logging and reporting
- **Usage Metrics**: Track API usage, response times, error rates
- **Alert Notifications**: Log all notification attempts and results

### Maintenance Tasks
- **Database Cleanup**: Archive old usage data (configurable retention)
- **Key Rotation**: Regular encryption key rotation procedures
- **Dependency Updates**: Regular security and feature updates
- **Performance Monitoring**: Track response times and optimize bottlenecks

## Future Enhancements

### Planned Features
- **Multi-provider Support**: Anthropic, Cohere, Azure OpenAI
- **Team Management**: Organization accounts, user roles
- **Advanced Analytics**: Cost forecasting, usage optimization
- **Mobile App**: React Native mobile application
- **API Access**: Public API for third-party integrations

### Scalability Considerations
- **Microservices**: Split into dedicated services as needed
- **Queue System**: Background job processing with Redis/Bull
- **CDN Integration**: Static asset optimization
- **Database Sharding**: Horizontal scaling for large datasets

## Troubleshooting Guide

### Common Issues
1. **API Key Not Working**: Check encryption/decryption, OpenAI API status
2. **No Usage Data**: Verify CRON jobs running, API key permissions
3. **Alerts Not Sending**: Check notification service configuration
4. **Dashboard Loading Slowly**: Check database query performance
5. **Authentication Issues**: Verify OAuth provider configuration

### Debug Commands
```bash
# Check database connection
pnpm db:studio

# View CRON job status
curl /api/cron/status

# Manual usage sync
curl -X POST /api/usage/sync

# Check application logs
pnpm dev (development)
```

This documentation provides a comprehensive overview of the SpendlyAI application architecture, features, and operational procedures. The system is production-ready with robust error handling, security measures, and monitoring capabilities.
