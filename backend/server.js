const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const redis = require('redis');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', err => console.error('Redis Client Error', err));
redisClient.connect();

// Initialize S3 client for audio storage
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to create deterministic cache keys
function canonicalStringify(obj) {
  const sortedKeys = Object.keys(obj).sort();
  const sortedObj = {};
  for (const key of sortedKeys) {
    sortedObj[key] = obj[key];
  }
  return JSON.stringify(sortedObj);
}

function generateCacheKey(templateId, inputs, voiceId = null) {
  const normalizedInputs = {};
  // Normalize inputs (lowercase, trim)
  for (const [key, value] of Object.entries(inputs)) {
    normalizedInputs[key] = String(value).toLowerCase().trim();
  }
  
  const baseKey = `${templateId}:${crypto
    .createHash('sha256')
    .update(canonicalStringify(normalizedInputs))
    .digest('hex')
    .substring(0, 16)}`;
  
  return voiceId ? `${baseKey}:${voiceId}` : baseKey;
}

// Helper function to get/set cache with status management
async function getCacheEntry(key) {
  try {
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

async function setCacheEntry(key, data, ttlSeconds = 86400 * 30) { // 30 days default
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

// OpenAI personalization function
async function personalizeScriptWithOpenAI(template, inputs) {
  const sport = inputs.sport;
  
  const systemPrompt = `You are an expert sports psychology coach specializing in creating audio visualization scripts.
Your task is to transform a generic visualization script into a professional, sport-specific audio script for text-to-speech.
You MUST fill in ALL placeholder variables with appropriate sport-specific content.`;

  const userPrompt = `Personalize this visualization script for someone who plays ${sport}.

Original Script:
${template.script}

IMPORTANT: Replace ALL these placeholders with sport-specific content:
- {{sport}} → ${sport}
- {{location}} → the typical venue/location for ${sport}
- {{sounds_of_the_sport}} → specific sounds heard during ${sport}
- {{key_action_of_the_sport}} → the main physical action/movement in ${sport}

Create a natural, flowing audio script that:
1. Replaces ALL placeholders with specific content
2. Uses present tense ("You are...", "You feel...")
3. Includes vivid sensory details for ${sport}
4. Maintains a calm, confident tone
5. Flows naturally for audio narration

Return ONLY the personalized script text, ready for text-to-speech.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

// TTS function (placeholder - implement with your TTS service)
async function generateAudioWithTTS(text, voiceId) {
  // This is a placeholder function
  // In production, you would:
  // 1. Call your TTS service (ElevenLabs, AWS Polly, etc.)
  // 2. Get the audio file
  // 3. Upload to S3
  // 4. Return the S3 URL
  
  console.log(`Generating audio with voice ${voiceId} for text length: ${text.length}`);
  
  // Simulate TTS generation
  const audioFileName = `audio_${Date.now()}_${voiceId}.mp3`;
  const s3Key = `visualizations/${audioFileName}`;
  
  // In production, upload actual audio file to S3
  // For now, return a placeholder URL
  return `https://your-s3-bucket.s3.amazonaws.com/${s3Key}`;
}

// Main personalization endpoint
app.post('/personalize-script', async (req, res) => {
  try {
    const { template_id, inputs, voice_id } = req.body;

    // Validate inputs
    if (!template_id || !inputs || !inputs.sport) {
      return res.status(400).json({
        status: 'error',
        error: 'Missing required fields: template_id and inputs.sport'
      });
    }

    // For this example, we'll use a hardcoded template
    // In production, you'd fetch this from a database
    const template = {
      id: 'goal_visualisation_sport_only_07',
      script: `1.\tPrepare: Find a comfortable position and close your eyes. Take five deep breaths.\n\n2.\tFocus: Bring your attention to your goal within the world of {{sport}}.\n\n3.\tVisualise the end result: See yourself successfully achieving your goal at the {{location}}. What does it look like? What colors do you see?\n\n4.\tAdd details: What can you hear? The {{sounds_of_the_sport}}. Who else is there?\n\n5.\tGo deeper: See yourself performing the {{key_action_of_the_sport}} perfectly. You are wearing your uniform and feel in complete control.\n\n6.\tConnect emotionally: Feel the pride and excitement of achieving this in {{sport}}.\n\n7.\tRehearse an action: Mentally rehearse the first physical step you'll take to train. See yourself taking that action.\n\n8.\tClose with clarity: Take five more deep breaths and gently open your eyes.`
    };

    // Generate cache keys
    const scriptKey = generateCacheKey(template_id, inputs);
    const audioKey = generateCacheKey(template_id, inputs, voice_id);

    console.log(`Processing request - Sport: ${inputs.sport}, Voice: ${voice_id}`);
    console.log(`Cache keys - Script: ${scriptKey}, Audio: ${audioKey}`);

    // Step 1: Check audio cache
    const cachedAudio = await getCacheEntry(audioKey);
    if (cachedAudio && cachedAudio.status === 'COMPLETED') {
      console.log('Cache hit: Returning cached audio');
      return res.json({
        status: 'ready',
        audioUrl: cachedAudio.audioUrl,
        scriptText: cachedAudio.scriptText,
        cached: true
      });
    }

    // Step 2: Check if already generating
    if (cachedAudio && cachedAudio.status === 'PENDING') {
      console.log('Generation in progress');
      return res.json({
        status: 'generating',
        estimatedTime: 30
      });
    }

    // Step 3: Set pending status to prevent race conditions
    await setCacheEntry(audioKey, {
      status: 'PENDING',
      createdAt: new Date().toISOString()
    }, 120); // 2 minute TTL for pending

    // Step 4: Check script cache
    let personalizedScript;
    const cachedScript = await getCacheEntry(scriptKey);
    
    if (cachedScript && cachedScript.scriptText) {
      console.log('Cache hit: Using cached script');
      personalizedScript = cachedScript.scriptText;
    } else {
      // Step 5: Generate new script with OpenAI
      console.log('Generating new personalized script');
      try {
        personalizedScript = await personalizeScriptWithOpenAI(template, inputs);
        
        // Cache the script
        await setCacheEntry(scriptKey, {
          scriptText: personalizedScript,
          sport: inputs.sport,
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        // Update cache with failed status
        await setCacheEntry(audioKey, {
          status: 'FAILED',
          error: error.message,
          createdAt: new Date().toISOString()
        }, 300); // 5 minute TTL for failed
        
        throw error;
      }
    }

    // Step 6: Generate audio
    console.log('Generating audio file');
    let audioUrl;
    try {
      audioUrl = await generateAudioWithTTS(personalizedScript, voice_id);
    } catch (error) {
      // Update cache with failed status
      await setCacheEntry(audioKey, {
        status: 'FAILED',
        error: 'TTS generation failed',
        scriptText: personalizedScript,
        createdAt: new Date().toISOString()
      }, 300); // 5 minute TTL for failed
      
      throw error;
    }

    // Step 7: Update cache with completed status
    const completedEntry = {
      status: 'COMPLETED',
      audioUrl: audioUrl,
      scriptText: personalizedScript,
      sport: inputs.sport,
      voiceId: voice_id,
      createdAt: new Date().toISOString()
    };
    
    await setCacheEntry(audioKey, completedEntry);

    // Return success response
    res.json({
      status: 'ready',
      audioUrl: audioUrl,
      scriptText: personalizedScript,
      cached: false
    });

  } catch (error) {
    console.error('Personalization error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message || 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment check:');
  console.log('- OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Set' : 'Not set');
  console.log('- Redis URL:', process.env.REDIS_URL || 'Using default');
  console.log('- AWS Configured:', process.env.AWS_ACCESS_KEY_ID ? 'Yes' : 'No');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await redisClient.quit();
  process.exit(0);
});