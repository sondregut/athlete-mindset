# Gemini TTS Quota Solutions

## Current Issue
You're hitting the quota limit for `gemini-2.5-flash-preview-tts`. This is common with preview models which have lower quotas.

## Solutions

### Option 1: Wait for Quota Reset
- Gemini quotas typically reset daily
- Check your quota at: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
- Usually resets at midnight Pacific Time

### Option 2: Use Different Gemini Model (Recommended)
Try using the stable TTS model instead of preview:

```typescript
// In functions/src/tts.ts
model: 'gemini-2.5-flash' // Instead of gemini-2.5-flash-preview-tts
```

### Option 3: Implement Fallback to Google Cloud TTS
Since you already have Firebase Functions, you can use Google Cloud TTS as a fallback:

1. Enable Google Cloud Text-to-Speech API in your project
2. The Firebase Admin SDK already has the necessary authentication
3. Use it when Gemini quota is exceeded

### Option 4: Implement Smart Caching
Your current implementation already has excellent caching:
- Local device cache
- Firebase Storage cache
- Request deduplication

This should minimize API calls significantly.

## Updated TTS Implementation with Fallback

Here's a hybrid approach that tries Gemini first, then falls back:

```typescript
async function generateWithGemini(
  genAI: GoogleGenerativeAI,
  text: string,
  voice: string,
  speed: number
): Promise<Buffer> {
  // Validate voice
  if (!GEMINI_VOICES.includes(voice)) {
    console.warn(`Invalid voice ${voice}, defaulting to Kore`);
    voice = 'Kore';
  }
  
  try {
    // Try Gemini TTS first
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-preview-tts',
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice,
            },
          },
        },
      } as any,
    });
    
    const response = await model.generateContent(text);
    const audioData = response.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!audioData) {
      throw new Error('No audio data received from Gemini TTS');
    }
    
    return Buffer.from(audioData, 'base64');
  } catch (error: any) {
    console.error('Gemini TTS failed:', error);
    
    // Check if it's a quota error
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      console.log('Gemini quota exceeded, implement fallback here');
      // Option: Return a pre-recorded message
      // Option: Use Google Cloud TTS
      // Option: Queue for later processing
    }
    
    throw error;
  }
}
```

## Quota Management Best Practices

1. **Monitor Usage**
   ```bash
   # Check your quota usage
   curl -H "x-goog-api-key: YOUR_API_KEY" \
     "https://generativelanguage.googleapis.com/v1/models"
   ```

2. **Implement Request Throttling**
   - Add delays between requests
   - Use exponential backoff on errors
   - Queue requests during high usage

3. **Optimize Caching**
   - Your multi-level cache is excellent
   - Consider pre-generating common phrases
   - Cache at the personalization level, not just TTS

4. **Use Batch Processing**
   - Group multiple TTS requests
   - Process during off-peak hours
   - Pre-generate audio for new visualizations

## Testing Without Hitting Quota

For testing, you can:

1. **Mock the TTS Response**
   ```typescript
   // In test mode, return a small test audio file
   if (process.env.NODE_ENV === 'test') {
     return Buffer.from('mock-audio-data');
   }
   ```

2. **Use Cached Content**
   - Test with previously generated audio
   - Skip TTS generation in tests

3. **Test Text Generation Only**
   - Text generation has higher quotas
   - Test personalization separately from TTS

## Next Steps

1. **For Now**: Your text generation is working perfectly. The app will work with cached audio.

2. **Tomorrow**: When quota resets, test TTS again.

3. **Long Term**: Consider:
   - Upgrading to a paid tier for higher quotas
   - Implementing Google Cloud TTS as fallback
   - Pre-generating common audio files

## Firebase Deployment

You can still deploy your functions. They will:
- ✅ Handle personalization perfectly (text generation works)
- ✅ Use cached audio when available
- ⚠️  Generate new audio when quota allows

Deploy with:
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

The app will gracefully handle TTS quota errors and use cached content when available.