# Spendly AI – Track & Control Your AI Spend
# SpendlyAI - Mint for API Tokens

A comprehensive AI API cost management platform that tracks, visualizes, and optimizes your AI service spending. Monitor usage across providers, set budget alerts, and gain insights into your AI API costs.

## 🚀 Features

- **Real-time Cost Monitoring** - Track AI API usage and costs in real-time
- **Multi-provider Support** - Currently supports OpenAI (extensible to other providers)
- **Smart Budget Alerts** - Email, Slack, and webhook notifications for budget thresholds
- **Interactive Analytics** - Rich charts and visualizations for usage trends
- **Secure API Key Management** - Encrypted storage with user isolation
- **Automated Data Collection** - CRON jobs for daily usage synchronization
- **Modern Dashboard** - Clean, responsive interface with dark theme

## 🏗️ Architecture

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (GitHub & Google OAuth)
- **State Management**: Zustand
- **Charts**: Recharts
- **Build System**: Turborepo (Monorepo)

## 📋 Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database
- GitHub/Google OAuth applications
- OpenAI API access (for testing)

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd spendlyAI
pnpm install
```

### 2. Environment Configuration

Copy the environment template and configure your variables:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/spendlyai"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# OAuth Providers
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Encryption (32 characters for AES-256)
ENCRYPTION_KEY="your-32-character-encryption-key"

# Optional: Email notifications
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@spendly.ai"
```

### 3. Database Setup

```bash
# Navigate to database package
cd packages/database

# Run migrations
pnpm db:migrate

# Generate Prisma client
pnpm db:generate
```

### 4. OAuth Provider Setup

#### GitHub OAuth:
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App with:
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

#### Google OAuth:
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID with:
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

### 5. Start Development Server

```bash
# From project root
pnpm dev
```

Visit `http://localhost:3000` to see the application.

## 🔧 Development Workflow

### Project Structure
```
spendlyAI/
├── apps/web/                 # Next.js application
│   ├── app/                 # App router pages & API routes
│   ├── components/          # React components
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities & services
│   └── stores/             # Zustand stores
├── packages/
│   ├── database/           # Prisma schema & migrations
│   ├── eslint-config/      # Shared ESLint config
│   ├── tailwind-config/    # Shared Tailwind config
│   └── ui/                 # Shared UI components
```

### Key Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Build for production
pnpm lint                   # Run ESLint

# Database
pnpm db:migrate            # Run migrations
pnpm db:generate           # Generate Prisma client
pnpm db:studio             # Open Prisma Studio

# Turborepo
pnpm build                 # Build all packages
pnpm lint                  # Lint all packages
```

## 📊 Usage Guide

### 1. Authentication
- Sign in with GitHub or Google OAuth
- Automatic user account creation

### 2. API Key Management
- Add your OpenAI API keys securely
- Keys are encrypted and never exposed to frontend
- Support for multiple keys per user

### 3. Usage Monitoring
- Automatic daily data collection via CRON jobs
- Real-time dashboard updates
- Historical usage trends and analytics

### 4. Budget Alerts
- Set cost, token, or request thresholds
- Multiple notification methods (email, Slack, webhooks)
- Configurable alert periods (daily, weekly, monthly)

## 🔒 Security Features

- **Encrypted API Keys**: AES-256 encryption for stored API keys
- **OAuth Authentication**: No password storage, OAuth providers only
- **User Isolation**: All data scoped to authenticated users
- **Input Validation**: Zod schema validation on all inputs
- **CSRF Protection**: Built-in NextAuth.js protection

## 🚀 Deployment

### Environment Setup
1. Set up PostgreSQL database (Railway, Supabase, etc.)
2. Configure OAuth providers with production URLs
3. Set all required environment variables
4. Generate secure encryption key

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Database Migration
```bash
# Run in production
pnpm db:deploy
```

## 📈 Monitoring & Maintenance

### Health Checks
- `/api/cron/status` - CRON job status
- `/api/user/me` - Authentication status
- Database connection monitoring

### CRON Jobs
- **Daily Usage Fetch**: 2 AM daily
- **Hourly Alert Check**: Every hour
- **Development**: 30-minute intervals

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the [documentation](./SPENDLYAI_WORKFLOW_DOCUMENTATION.md)
- Open an issue on GitHub
- Review the troubleshooting guide in the documentation

## 🎯 Roadmap

- [ ] Multi-provider support (Anthropic, Cohere, Azure OpenAI)
- [ ] Team management and organization accounts
- [ ] Advanced cost forecasting and optimization
- [ ] Mobile application
- [ ] Public API for integrations from a single dashboard.

🔐 Secure API Key Handling: Your keys are encrypted and stored safely.

🎯 Who is this for?
Indie hackers building SaaS products on top of AI.
Startups scaling with AI APIs.

Agencies experimenting with GPT, Claude, and other models.

Any developer who wants to avoid billing surprises.

🌍 Why Spendly AI?
Simple Setup: Connect and start tracking your spend in minutes.

Peace of Mind: Never get a surprise AI bill again.

Scalable: Designed to work for solo developers and growing teams.

Ready to take control of your AI spending?
