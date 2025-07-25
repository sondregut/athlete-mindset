# Gemini API Quota Management Implementation

## Overview
This document describes the quota management system implemented to prevent Gemini API 429 (quota exceeded) errors.

## Problem Solved
- **Issue**: Excessive API calls during personalization preloading causing quota exhaustion
- **Root Cause**: Preloader generating audio for ALL visualizations without quota checks
- **Impact**: Users hitting daily API limits, blocking all TTS functionality

## Solution Components

### 1. GeminiQuotaManager Service (`services/gemini-quota-manager.ts`)
Central service for tracking and managing API quota usage:

- **Local Quota Tracking**: Tracks API calls locally with AsyncStorage persistence
- **Daily Reset**: Automatically resets at midnight Pacific Time (7 AM UTC)
- **Rate Limiting**: Enforces 6-second minimum between requests (10 req/min limit)
- **Quota Checks**: Prevents requests when quota is exhausted
- **Warning System**: Warns at 80% quota usage
- **Configurable Limits**: Default 1500 requests/day (free tier)

Key methods:
- `canMakeRequest()`: Check if request is allowed
- `recordRequest()`: Track successful API calls
- `recordQuotaError()`: Handle 429 errors
- `getQuotaStatus()`: Get current usage statistics
- `shouldPreload()`: Smart preloading decision based on quota

### 2. Smart Preloading Limits
The PersonalizationPreloader now:
- Checks quota before starting preload
- Skips preloading if quota > 50% used
- Limits visualizations based on quota:
  - < 25% used: Preload 5 visualizations
  - < 50% used: Preload 3 visualizations
  - >= 50% used: Preload 1 visualization only
- Stops immediately on quota errors

### 3. Enhanced Debug Screen
Added comprehensive quota monitoring in `/debug-gemini`:
- **Local Quota Tracking**: Visual progress bar and statistics
- **Live API Check**: Test actual API quota status
- **Reset Function**: Manual reset for quota counter
- **Detailed Metrics**: Usage percentage, remaining calls, reset time

### 4. Request Flow Protection
All TTS requests now follow this flow:
1. Check local quota manager
2. If allowed, proceed with request
3. Record successful request
4. Handle 429 errors by blocking further requests

## Usage Guidelines

### For Developers
1. **Monitor Quota**: Check debug screen regularly during development
2. **Reset if Needed**: Use reset function if counter gets out of sync
3. **Adjust Limits**: Modify `DAILY_QUOTA_LIMIT` based on your API tier

### For Users
1. **Preloading**: Will automatically limit based on quota usage
2. **Warnings**: System warns when approaching limits
3. **Recovery**: Quota resets daily at midnight Pacific Time

## Configuration

### Environment Variables
- `GEMINI_API_KEY`: Your Gemini API key (required)

### Quota Limits (in `gemini-quota-manager.ts`)
```typescript
private readonly DAILY_QUOTA_LIMIT = 1500; // Adjust based on your tier
private readonly WARNING_THRESHOLD = 0.8; // Warn at 80% usage
private readonly REQUESTS_PER_MINUTE = 10;
```

## Error Messages
- "Daily quota exceeded. Resets at midnight Pacific Time."
- "Rate limit - too many requests" (with wait time)
- "Quota limit reached: [reason]"

## Best Practices
1. **Cache First**: Always check cache before making API calls
2. **Batch Requests**: Group similar requests when possible
3. **Monitor Usage**: Check quota status before bulk operations
4. **Handle Errors**: Gracefully handle quota errors with user feedback

## Troubleshooting

### Quota Errors Still Occurring
1. Check if local quota counter is accurate
2. Verify API key has proper permissions
3. Check Google Cloud Console for actual usage
4. Reset local counter if out of sync

### Preloading Not Working
1. Check quota status - may be disabled due to high usage
2. Verify personalization service is configured
3. Check console logs for specific errors

## Future Improvements
1. **Tiered Preloading**: More granular control based on user activity
2. **Quota Alerts**: Push notifications when approaching limits
3. **Usage Analytics**: Track patterns to optimize quota usage
4. **Paid Tier Support**: Automatic limit adjustment based on billing

## Related Files
- `services/gemini-quota-manager.ts` - Core quota management
- `services/gemini-tts-service.ts` - TTS with quota checks
- `services/personalization-preloader.ts` - Smart preloading
- `app/debug-gemini.tsx` - Debug and monitoring UI