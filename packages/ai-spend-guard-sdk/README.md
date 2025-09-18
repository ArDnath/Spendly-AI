# AI Spend Guard SDK

Official TypeScript/JavaScript SDK for AI Spend Guard - Track and control your OpenAI API usage with real-time monitoring, budgets, and alerts.

## Installation

```bash
npm install @ai-spend-guard/sdk
```

## Quick Start

```typescript
import { createSpendGuard } from '@ai-spend-guard/sdk';

// Initialize with your API key ID from AI Spend Guard dashboard
const spendGuard = createSpendGuard({
  apiKeyId: 'your-api-key-id-from-dashboard',
  baseURL: 'https://your-spendly-domain.com/api/proxy', // Optional: defaults to production
  authToken: 'your-auth-token' // Optional: for authenticated requests
});

// Use exactly like OpenAI SDK, but with automatic usage tracking
const response = await spendGuard.createChatCompletion({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'Hello, world!' }
  ],
  max_tokens: 100
});

console.log(response.choices[0].message.content);
console.log('Cost:', response.spendly_metadata.cost);
console.log('Month total:', response.spendly_metadata.currentMonthTotal);
```

## Features

### 🔄 Drop-in Replacement
Replace your OpenAI SDK calls with zero code changes - just initialize with AI Spend Guard and get automatic usage tracking.

### 💰 Real-time Cost Tracking
Every API call is tracked in real-time with accurate cost calculations based on current OpenAI pricing.

### 🚨 Budget Protection
Set hard limits to automatically block requests when budgets are exceeded, preventing unexpected bills.

### 📊 Usage Analytics
Get detailed analytics with projections, trends, and breakdowns by model and endpoint.

### ⚡ Smart Alerts
Multi-channel alerts (Email, Slack, Discord, Teams) with intelligent throttling to prevent alert fatigue.

## API Reference

### Creating Chat Completions

```typescript
const response = await spendGuard.createChatCompletion({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is the capital of France?' }
  ],
  max_tokens: 150,
  temperature: 0.7
});

// Response includes usage metadata
console.log(response.spendly_metadata);
// {
//   cost: 0.045,
//   currentMonthTotal: 12.34,
//   apiKeyId: 'key_123',
//   tracked: true
// }
```

### Getting Usage Statistics

```typescript
const stats = await spendGuard.getUsageStats('monthly');
console.log(stats);
// {
//   period: { type: 'monthly', start: '2024-01-01', ... },
//   current: { totalCost: 45.67, totalTokens: 123456, ... },
//   projections: { projectedSpend: 89.23, trend: 'increasing', ... },
//   dailyUsage: [...],
//   breakdown: { byProvider: [...], byEndpoint: [...] }
// }
```

### Creating Budgets

```typescript
const budget = await spendGuard.createBudget({
  name: 'Monthly Development Budget',
  amount: 100.00,
  period: 'monthly',
  type: 'hard' // 'soft' for alerts only, 'hard' to block requests
});
```

### Setting Up Alerts

```typescript
// Email alert
const emailAlert = await spendGuard.createAlert({
  name: 'High Usage Alert',
  threshold: 50,
  thresholdType: 'cost',
  period: 'monthly',
  notificationMethod: 'email'
});

// Slack alert
const slackAlert = await spendGuard.createAlert({
  name: 'Budget Warning',
  threshold: 75,
  thresholdType: 'cost',
  period: 'monthly',
  notificationMethod: 'slack:https://hooks.slack.com/your-webhook-url'
});

// Multiple channels
const multiAlert = await spendGuard.createAlert({
  name: 'Critical Alert',
  threshold: 90,
  thresholdType: 'cost',
  period: 'monthly',
  notificationMethod: 'email,slack:https://hooks.slack.com/webhook,discord:https://discord.com/webhook'
});
```

## Error Handling

```typescript
import { SpendGuardError } from '@ai-spend-guard/sdk';

try {
  const response = await spendGuard.createChatCompletion({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello!' }]
  });
} catch (error) {
  if (error instanceof SpendGuardError) {
    if (error.statusCode === 429) {
      console.log('Budget limit exceeded!');
      console.log('Reason:', error.reason);
      console.log('Current cost:', error.currentCost);
      console.log('Projected cost:', error.projectedCost);
    } else {
      console.log('API error:', error.message);
    }
  } else {
    console.log('Unexpected error:', error);
  }
}
```

## Migration from OpenAI SDK

### Before (OpenAI SDK)
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

### After (AI Spend Guard SDK)
```typescript
import { createSpendGuard } from '@ai-spend-guard/sdk';

const spendGuard = createSpendGuard({
  apiKeyId: process.env.SPENDGUARD_API_KEY_ID // From your dashboard
});

const response = await spendGuard.createChatCompletion({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }]
});

// Now you get automatic tracking + all the same response data
console.log('Cost this request:', response.spendly_metadata.cost);
```

## Configuration

### Environment Variables

```bash
# Required: Your API Key ID from AI Spend Guard dashboard
SPENDGUARD_API_KEY_ID=key_abc123

# Optional: Custom base URL for self-hosted instances
SPENDGUARD_BASE_URL=https://your-domain.com/api/proxy

# Optional: Authentication token for private instances
SPENDGUARD_AUTH_TOKEN=your-auth-token
```

### TypeScript Support

The SDK is written in TypeScript and includes full type definitions. All OpenAI types are preserved and extended with usage metadata.

```typescript
import type { SpendGuardResponse, UsageMetadata } from '@ai-spend-guard/sdk';

const response: SpendGuardResponse = await spendGuard.createChatCompletion({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }]
});

const metadata: UsageMetadata = response.spendly_metadata;
```

## Subscription Plans

| Feature | Free | Pro | Team | Advanced |
|---------|------|-----|------|----------|
| API Keys | 1 | 5 | Unlimited | Unlimited |
| Monthly Spend Limit | $20 | $500 | $5,000 | $50,000 |
| History | 7 days | 30 days | 90 days | 365 days |
| Alert Channels | Email | Email, Slack, Discord | + Teams, Priority | + Webhooks, SSO |
| CSV Export | ❌ | ✅ | ✅ | ✅ |
| Team Accounts | ❌ | ❌ | ✅ | ✅ |

## Support

- 📖 [Documentation](https://docs.aispendguard.com)
- 💬 [Discord Community](https://discord.gg/aispendguard)
- 📧 [Email Support](mailto:support@aispendguard.com)
- 🐛 [GitHub Issues](https://github.com/your-org/ai-spend-guard/issues)

## License

MIT License - see [LICENSE](LICENSE) file for details.
