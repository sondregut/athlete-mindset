# Gemini API Billing Guide - Increase Request Limits

## Current Situation
- **Free Tier**: 1,500 requests per day
- **Rate Limit**: 10 requests per minute
- **Cost**: Free

## How to Increase Limits

### Option 1: Enable Pay-As-You-Go Billing (Recommended)

1. **Go to Google AI Studio Billing**:
   ```
   https://aistudio.google.com/app/billing
   ```

2. **Click "Enable Billing"** and follow the prompts

3. **New Limits After Billing**:
   - **Requests**: Up to 2 million per day
   - **Rate Limit**: 2,000 requests per minute
   - **Cost**: $0.00025 per 1K characters (very affordable)

### Option 2: Use Google Cloud Platform

1. **Create/Select a GCP Project**:
   ```
   https://console.cloud.google.com/
   ```

2. **Enable Billing**:
   - Go to Billing → Link a billing account
   - Add payment method

3. **Enable Generative Language API**:
   ```
   https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
   ```

4. **Create API Key with Higher Quota**:
   - APIs & Services → Credentials → Create Credentials → API Key

## Pricing Details

### Gemini 2.5 Flash (TTS Model)
- **Input**: $0.00025 per 1K characters
- **Output**: $0.00025 per 1K characters
- **Audio Generation**: Included in output pricing

### Example Costs
- 10,000 TTS requests (avg 200 chars each) = 2M characters
- Cost: 2,000 × $0.00025 = **$0.50**
- That's 50 cents for 10,000 requests!

## Update Your Code

After enabling billing, update the quota limit in your code:

```typescript
// services/gemini-quota-manager.ts
const DAILY_LIMIT = 2000000; // 2 million for paid tier (was 1500)
```

## Monitor Usage

1. **Google Cloud Console**:
   ```
   https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/metrics
   ```

2. **Set Budget Alerts**:
   - Billing → Budgets & alerts
   - Create budget with email alerts

## Free Credits

- New Google Cloud users get **$300 free credits** for 90 days
- More than enough for testing and development

## Immediate Temporary Solution

If you need to test RIGHT NOW without waiting for billing:

1. **Create a new Google account**
2. **Get a new API key** (fresh 1,500 daily quota)
3. **Update .env file** with new key

But this is only temporary - billing is the proper solution.

## Questions?

- **Billing Support**: https://cloud.google.com/billing/docs/how-to/get-support
- **API Documentation**: https://ai.google.dev/pricing