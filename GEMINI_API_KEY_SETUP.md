# Gemini API Key Setup and Testing Guide

## Overview
This guide ensures your Gemini API key is properly configured for both:
1. **Text Generation** (for personalization)
2. **Text-to-Speech** (for audio generation)

## Step 1: Test Your API Key Locally

### Run the API Key Test Script
```bash
# This tests both text generation and TTS
bun run scripts/test-gemini-api-key.ts
```

Expected output:
- ✅ API key found
- ✅ Text generation successful
- ✅ TTS generation successful
- ✅ All voices available

If any tests fail, check:
1. Your `.env` file has `GEMINI_API_KEY=your-actual-key`
2. The API key has proper permissions at https://aistudio.google.com/app/apikey
3. You're not hitting quota limits

## Step 2: Set Firebase Secret

### Check if Secret is Already Set
```bash
./scripts/test-firebase-secret.sh
```

### Set the Secret (if needed)
```bash
firebase functions:secrets:set GEMINI_API_KEY
```
When prompted, paste your Gemini API key (same one from .env file).

### Verify Secret is Set
```bash
firebase functions:secrets:list
# Should show: GEMINI_API_KEY
```

## Step 3: Update Functions Configuration

The functions are already configured to use the secret. Key points:

### In `functions/src/index.ts`:
- Functions have `secrets: ['GEMINI_API_KEY']` in runWith config
- This gives them access to `process.env.GEMINI_API_KEY`

### In `functions/src/tts.ts`:
- Uses Gemini SDK with model `gemini-2.5-flash-preview-tts`
- Supports voices: Aoede, Charon, Fenrir, Kore, Puck, Saga
- Configured for AUDIO response modality

### In `functions/src/personalization.ts`:
- Uses `gemini-1.5-pro` for text generation
- Generates sport-specific personalizations

## Step 4: Deploy and Test

### Deploy Functions
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### Test in App
1. Start your app
2. Navigate to `/debug-cloud-functions`
3. Enable Cloud Functions
4. Run all tests

## Troubleshooting

### "API_KEY_INVALID" Error
- Double-check the key in Firebase secret matches your .env
- Regenerate key at https://aistudio.google.com if needed
- Make sure you're using the correct Google account

### "Response modality not supported" Error
- This means TTS isn't available for your API key
- Try using the REST API fallback approach
- Check if your project has TTS features enabled

### Voice Not Working
- Gemini supports: Aoede, Charon, Fenrir, Kore, Puck, Saga
- Default to "Kore" if unsure
- Case-sensitive voice names

### Functions Not Deploying
```bash
# Check Node version (should be 18+)
node --version

# Clean and rebuild
cd functions
rm -rf node_modules lib
npm install
npm run build
cd ..
```

## API Key Best Practices

1. **Never commit API keys** to git
2. **Use Firebase secrets** for production
3. **Set up budget alerts** in Google Cloud Console
4. **Monitor usage** regularly
5. **Rotate keys** periodically

## Testing Commands Summary

```bash
# Test locally
bun run scripts/test-gemini-api-key.ts

# Check Firebase secret
./scripts/test-firebase-secret.sh

# View function logs
firebase functions:log --only personalizeVisualization
firebase functions:log --only generateAudioTTS

# Monitor live
firebase functions:log --follow
```

## Expected Models and Features

### Text Generation (Personalization)
- Model: `gemini-1.5-pro`
- Used for: Generating sport-specific content
- Input: Text prompts
- Output: JSON with personalized steps

### Text-to-Speech
- Model: `gemini-2.5-flash-preview-tts`
- Used for: Converting text to audio
- Input: Text + voice selection
- Output: Audio data (base64)
- Format: PCM audio that can be converted to WAV

Both features should work with the same API key.