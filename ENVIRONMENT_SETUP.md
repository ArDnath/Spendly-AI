# AI Spend Guard - Environment Setup Guide

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Stripe account (for billing)
- OpenAI API key (for testing)
- Email service (Gmail/SMTP for notifications)

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd spendlyAI
   npm install
   ```

2. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb spendlyai
   
   # Copy environment file
   cp .env.example .env
   
   # Update DATABASE_URL in .env
   DATABASE_URL="postgresql://username:password@localhost:5432/spendlyai"
   
   # Run database migrations
   cd packages/database
   npx prisma migrate dev
   npx prisma generate
   ```

3. **Environment Configuration**
   
   Edit `.env` file with your configuration:

   ```bash
   # Required - Database
   DATABASE_URL="postgresql://username:password@localhost:5432/spendlyai"
   
   # Required - NextAuth
   NEXTAUTH_SECRET="your-secure-random-string-here"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Required - OAuth (at least one)
   GITHUB_CLIENT_ID="your-github-oauth-app-client-id"
   GITHUB_CLIENT_SECRET="your-github-oauth-app-secret"
   # OR
   GOOGLE_CLIENT_ID="your-google-oauth-client-id"
   GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
   
   # Required - API Key Encryption (32 characters)
   ENCRYPTION_KEY="your-32-character-encryption-key-here"
   
   # Required - Stripe Billing
   STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
   STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
   STRIPE_PRO_PRICE_ID="price_your-pro-price-id"
   STRIPE_TEAM_PRICE_ID="price_your-team-price-id"
   STRIPE_ADVANCED_PRICE_ID="price_your-advanced-price-id"
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Detailed Configuration

### Database Setup

1. **Install PostgreSQL**
   ```bash
   # Ubuntu/Debian
   sudo apt install postgresql postgresql-contrib
   
   # macOS
   brew install postgresql
   
   # Start PostgreSQL service
   sudo systemctl start postgresql  # Linux
   brew services start postgresql   # macOS
   ```

2. **Create Database and User**
   ```sql
   sudo -u postgres psql
   CREATE DATABASE spendlyai;
   CREATE USER spendlyai_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE spendlyai TO spendlyai_user;
   \q
   ```

3. **Run Migrations**
   ```bash
   cd packages/database
   npx prisma migrate dev --name init
   npx prisma generate
   ```

### OAuth Setup

#### GitHub OAuth App
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App:
   - Application name: "AI Spend Guard"
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. Copy Client ID and Client Secret to `.env`

#### Google OAuth App
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
3. Copy Client ID and Client Secret to `.env`

### Stripe Setup

1. **Create Stripe Account** at https://stripe.com
2. **Get API Keys** from Dashboard > Developers > API keys
3. **Create Products and Prices**:
   ```bash
   # Pro Plan - $9/month
   stripe products create --name="Pro Plan" --description="5 API keys, $100 spend limit"
   stripe prices create --product=prod_xxx --unit-amount=900 --currency=usd --recurring[interval]=month
   
   # Team Plan - $29/month  
   stripe products create --name="Team Plan" --description="20 API keys, $500 spend limit, Organizations"
   stripe prices create --product=prod_xxx --unit-amount=2900 --currency=usd --recurring[interval]=month
   
   # Advanced Plan - $99/month
   stripe products create --name="Advanced Plan" --description="Unlimited keys and spend"
   stripe prices create --product=prod_xxx --unit-amount=9900 --currency=usd --recurring[interval]=month
   ```

4. **Setup Webhooks**:
   - Endpoint URL: `https://your-domain.com/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

### Email Configuration (Optional)

For Gmail with App Password:
```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-character-app-password"
FROM_EMAIL="noreply@your-domain.com"
```

### Encryption Key Generation

Generate a secure 32-character encryption key:
```bash
# Using OpenSSL
openssl rand -hex 16

# Using Node.js
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## Production Deployment

### Environment Variables for Production

```bash
# Production Database
DATABASE_URL="postgresql://user:pass@your-db-host:5432/spendlyai"

# Production URLs
NEXTAUTH_URL="https://your-domain.com"
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Production Stripe
STRIPE_SECRET_KEY="sk_live_your-live-stripe-key"

# Security
NODE_ENV="production"
ENABLE_DEBUG_LOGGING="false"

# Background Jobs
ENABLE_BACKGROUND_JOBS="true"
```

### Vercel Deployment

1. **Connect Repository** to Vercel
2. **Set Environment Variables** in Vercel dashboard
3. **Configure Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `apps/web/.next`
   - Install Command: `npm install`

### Database Migration in Production

```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify DATABASE_URL format
   - Ensure database exists and user has permissions

2. **OAuth Login Issues**
   - Verify callback URLs match exactly
   - Check client ID/secret are correct
   - Ensure OAuth app is not in development mode restrictions

3. **Stripe Webhook Issues**
   - Verify webhook endpoint URL is accessible
   - Check webhook secret matches
   - Ensure all required events are selected

4. **API Key Encryption Issues**
   - Ensure ENCRYPTION_KEY is exactly 32 characters
   - Don't change encryption key after storing API keys

### Development Tips

1. **Database Reset**
   ```bash
   cd packages/database
   npx prisma migrate reset
   npx prisma db seed  # if you have seed data
   ```

2. **View Database**
   ```bash
   npx prisma studio
   ```

3. **Test Stripe Webhooks Locally**
   ```bash
   # Install Stripe CLI
   stripe listen --forward-to localhost:3000/api/billing/webhook
   ```

4. **Background Jobs Testing**
   ```bash
   # Disable in development if needed
   ENABLE_BACKGROUND_JOBS="false"
   ```

## Security Checklist

- [ ] Use strong, unique NEXTAUTH_SECRET
- [ ] Use secure 32-character ENCRYPTION_KEY
- [ ] Enable HTTPS in production
- [ ] Use environment variables for all secrets
- [ ] Regularly rotate API keys and secrets
- [ ] Enable Stripe webhook signature verification
- [ ] Use production Stripe keys in production
- [ ] Set up proper database backups
- [ ] Configure rate limiting
- [ ] Enable audit logging

## Support

For issues and questions:
1. Check this documentation
2. Review API documentation in `API_DOCUMENTATION.md`
3. Check application logs
4. Review Prisma schema in `packages/database/prisma/schema.prisma`
