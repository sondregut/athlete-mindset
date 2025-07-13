# OpenAI GPT-4o-mini Personalization Integration

This document explains how to use the OpenAI GPT-4o-mini integration for generating personalized visualization content in the Athlete Mindset app.

## Overview

The personalization service uses OpenAI's GPT-4o-mini model to create sport-specific, context-aware visualization content based on each athlete's profile and current situation. This provides a more engaging and relevant mental training experience.

## Features

- **Smart Personalization**: Adapts generic visualizations to be sport-specific
- **Context Awareness**: Considers time until event, mood, location, etc.
- **Cost Optimization**: Uses GPT-4o-mini (cheaper than GPT-4) with aggressive caching
- **Fallback Support**: Gracefully falls back to original content if API fails
- **Performance Tracking**: Built-in stats for monitoring usage and costs

## Setup

The service uses the same `OPENAI_API_KEY` environment variable as the TTS service:

```bash
# .env file
OPENAI_API_KEY=sk-your-openai-api-key-here
```

## Basic Usage

### 1. Using the React Hook (Recommended)

```typescript
import { usePersonalizedVisualization } from '@/hooks/usePersonalizedVisualization';

function VisualizationPlayer({ visualization }) {
  const {
    personalizedSteps,    // Personalized content
    isGenerating,         // Loading state
    error,               // Error message if any
    regenerate,          // Function to regenerate
    stats                // Usage statistics
  } = usePersonalizedVisualization(visualization, {
    contextualFactors: {
      timeOfDay: 'morning',
      timeUntilEvent: '2 hours',
      currentMood: 'nervous but excited',
      location: 'competition-venue'
    }
  });

  // Use personalizedSteps instead of visualization.steps
  const steps = personalizedSteps || visualization.steps;
}
```

### 2. Using the Service Directly

```typescript
import { OpenAIPersonalizationService } from '@/services/openai-personalization-service';

const service = OpenAIPersonalizationService.getInstance();

const personalizedContent = await service.generatePersonalizedVisualization({
  userContext: {
    sport: 'track-and-field',
    trackFieldEvent: 'sprints-100m',
    experienceLevel: 'advanced',
    primaryFocus: 'performance',
    goals: 'Break 10 seconds in 100m'
  },
  visualizationId: 'pre-comp-001',
  visualizationTitle: 'Pre-Competition Focus',
  visualizationCategory: 'confidence',
  baseContent: [
    'Take a deep breath and center yourself',
    'Visualize your perfect race execution',
    'Feel the power in your muscles'
  ],
  contextualFactors: {
    timeUntilEvent: '30 minutes',
    location: 'competition-venue'
  },
  tone: 'energizing',
  length: 'medium'
});
```

## Personalization Examples

### Original Content:
"Visualize yourself performing at your best, feeling strong and confident."

### Personalized for 100m Sprinter:
"Visualize yourself in the blocks, coiled like a spring. Feel the explosive power in your quads and hamstrings as you drive out, each stride perfectly timed, arms pumping in sync, crossing the line with perfect form."

### Personalized for Swimmer:
"Visualize yourself on the blocks, muscles taut and ready. Feel the perfect streamline as you enter the water, your powerful stroke cutting through the lane, flip turns crisp and explosive, touching the wall with strength."

## User Preferences

Users can control personalization through the settings:

```typescript
import { usePersonalizationStore } from '@/store/personalization-store';

const { preferences, updatePreferences } = usePersonalizationStore();

// Update preferences
updatePreferences({
  enabled: true,              // Turn on/off personalization
  autoPersonalize: true,      // Automatically personalize content
  preferredTone: 'calming',   // motivational | calming | focused | energizing
  contentLength: 'medium',    // short | medium | long
  includeContextualFactors: true,
  cachePersonalizedContent: true
});
```

## Caching Strategy

The service implements a multi-layer caching strategy:

1. **Memory Cache**: LRU cache with 20MB limit
2. **AsyncStorage Cache**: Persistent cache with 1-week TTL
3. **Cache Key Generation**: Based on user profile + visualization + context

Cache keys are deterministic, so identical requests will hit the cache:
- Same sport, experience level, and visualization = cache hit
- Different mood or time of day = new generation

## Cost Management

### Token Usage
- Average request: ~500-800 tokens
- GPT-4o-mini pricing: $0.150 per 1M input tokens, $0.600 per 1M output tokens
- Estimated cost per personalization: ~$0.0006 (0.06 cents)

### Cost Optimization
1. **Aggressive Caching**: 90%+ cache hit rate expected
2. **Smart Prompts**: Optimized prompts to minimize tokens
3. **Batch Processing**: Queue requests to avoid rate limits
4. **Fallback Content**: Use original content if API fails

## Monitoring

Check personalization stats:

```typescript
const service = OpenAIPersonalizationService.getInstance();
const stats = service.getStats();

console.log({
  totalRequests: stats.totalRequests,
  cacheHitRate: (stats.cacheHits / stats.totalRequests) * 100,
  apiCalls: stats.apiCalls,
  tokensUsed: stats.totalTokensUsed,
  estimatedCost: (stats.totalTokensUsed / 1000000) * 0.375 // Rough estimate
});
```

## Error Handling

The service handles errors gracefully:

1. **Network Errors**: Retry with exponential backoff
2. **Rate Limits**: Queue requests with 1-second intervals
3. **API Errors**: Fall back to original content
4. **Invalid Key**: Clear error message to user

## Best Practices

1. **Preload During Onboarding**: Generate personalized content for popular visualizations
2. **Context Matters**: Include relevant contextual factors for better personalization
3. **Monitor Usage**: Check stats regularly to ensure costs stay reasonable
4. **User Control**: Let users toggle personalization on/off
5. **Feedback Loop**: Track which personalizations users prefer

## Troubleshooting

### "Invalid API key" Error
- Check that `OPENAI_API_KEY` is set in `.env`
- Ensure the key has access to GPT-4o-mini
- Restart Metro bundler after changing `.env`

### Personalization Not Working
1. Check if personalization is enabled in settings
2. Verify user has complete profile (sport, experience level)
3. Check console for error messages
4. Try clearing cache: `service.clearCache()`

### High API Costs
1. Check cache hit rate (should be >90%)
2. Review token usage in stats
3. Consider reducing content length preference
4. Implement user limits if needed

## Future Enhancements

- [ ] Batch personalization for multiple visualizations
- [ ] A/B testing personalized vs original content
- [ ] User feedback on personalization quality
- [ ] Fine-tuned model for sports psychology
- [ ] Offline personalization with local LLM