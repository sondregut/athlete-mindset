# Personalized Visualization Backend

This backend service provides personalized sports visualization scripts using OpenAI and generates audio files for guided meditation.

## Features

- **Sport-based personalization**: Scripts are personalized based solely on the user's sport
- **Multi-layer caching**: Prevents duplicate API calls for same content
- **Status tracking**: Handles concurrent requests gracefully
- **Deterministic cache keys**: Consistent hashing regardless of input order

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your API keys:
```bash
cp .env.example .env
```

3. Set up Redis (using Docker):
```bash
docker run -d -p 6379:6379 redis:alpine
```

4. Start the server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

## API Endpoints

### POST /personalize-script
Generates a personalized visualization script and audio file.

**Request body:**
```json
{
  "template_id": "goal_visualisation_sport_only_07",
  "inputs": {
    "sport": "Soccer"
  },
  "voice_id": "rachel"
}
```

**Response:**
```json
{
  "status": "ready",
  "audioUrl": "https://s3.amazonaws.com/...",
  "scriptText": "Personalized script content...",
  "cached": false
}
```

**Status values:**
- `ready`: Content is available
- `generating`: Request is being processed
- `error`: An error occurred

### GET /health
Health check endpoint.

## Cache Strategy

The service implements a sophisticated caching strategy:

1. **Audio Cache** (Level 1): Check if audio file exists for sport+voice combo
2. **Script Cache** (Level 2): Check if personalized script exists for sport
3. **Generation**: Only call OpenAI/TTS if not cached

Cache keys are generated using SHA-256 hashes of normalized inputs.

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `REDIS_URL`: Redis connection URL (default: redis://localhost:6379)
- `AWS_ACCESS_KEY_ID`: AWS credentials for S3
- `AWS_SECRET_ACCESS_KEY`: AWS credentials for S3
- `AWS_REGION`: AWS region (default: us-east-1)
- `PORT`: Server port (default: 3000)

## Production Considerations

1. **TTS Integration**: The current implementation has a placeholder for TTS. Integrate with ElevenLabs or AWS Polly.
2. **S3 Configuration**: Set up proper S3 bucket with CDN for audio delivery.
3. **Rate Limiting**: Add rate limiting to prevent abuse.
4. **Monitoring**: Add logging and monitoring (e.g., Datadog, New Relic).
5. **Security**: Implement API authentication and CORS configuration.

## Cache Management

The service tracks cache status to prevent race conditions:
- `PENDING`: Generation in progress
- `COMPLETED`: Content ready
- `FAILED`: Generation failed (short TTL for retry)

TTL values:
- Successful entries: 30 days
- Failed entries: 5 minutes
- Pending entries: 2 minutes