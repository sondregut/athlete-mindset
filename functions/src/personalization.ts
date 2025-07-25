import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as crypto from 'crypto';
import { 
  PersonalizationRequest, 
  PersonalizedContent, 
  PersonalizedStep,
  SportContext,
  VisualizationTemplate 
} from './types';

// Lazy initialization of Firestore to avoid initialization issues
const getFirestore = () => admin.firestore();

// Sport-specific contexts matching the client
const SPORT_CONTEXTS: Record<string, SportContext> = {
  'sprinting': {
    equipment: ['sprint spikes', 'starting blocks', 'track lanes'],
    environments: ['100m track', '200m curve', 'stadium', 'practice track'],
    mentalChallenges: ['explosive power', 'reaction time', 'staying relaxed at speed', 'block starts'],
    movements: ['drive phase', 'acceleration', 'top speed mechanics', 'block clearance'],
  },
  'distance_running': {
    equipment: ['distance spikes', 'racing flats', 'GPS watch'],
    environments: ['track', 'cross country course', 'roads', 'trails'],
    mentalChallenges: ['pacing discipline', 'pain tolerance', 'mental toughness', 'race strategy'],
    movements: ['efficient stride', 'breathing rhythm', 'surge tactics', 'kick finish'],
  },
  'high_jump': {
    equipment: ['high jump spikes', 'landing mat', 'crossbar', 'standards'],
    environments: ['high jump apron', 'field house', 'outdoor field'],
    mentalChallenges: ['approach consistency', 'fearlessness', 'technical focus', 'bar clearance'],
    movements: ['J-curve approach', 'plant step', 'takeoff', 'Fosbury flop', 'arch position'],
  },
  'general': {
    equipment: ['training gear', 'equipment', 'practice space'],
    environments: ['training facility', 'competition venue', 'practice area'],
    mentalChallenges: ['focus', 'confidence', 'preparation', 'performance'],
    movements: ['technique', 'form', 'execution', 'consistency'],
  },
};

export async function generatePersonalizedVisualization(
  genAI: GoogleGenerativeAI,
  request: PersonalizationRequest
): Promise<PersonalizedContent> {
  const { visualizationId, userContext, forceRegenerate } = request;
  
  // Generate cache key
  const cacheKey = generateCacheKey(visualizationId, userContext);
  
  // Check cache unless forced to regenerate
  if (!forceRegenerate) {
    const cached = await getCachedPersonalization(cacheKey);
    if (cached) {
      console.log(`Cache hit for ${cacheKey}`);
      return cached;
    }
  }
  
  // Load visualization template from Firestore
  const template = await getVisualizationTemplate(visualizationId);
  if (!template) {
    throw new Error(`Visualization ${visualizationId} not found`);
  }
  
  // Generate personalized content
  const personalizedSteps = await personalizeWithGemini(genAI, template, userContext);
  
  // Create response object
  const personalizedContent: PersonalizedContent = {
    steps: personalizedSteps,
    generatedAt: new Date().toISOString(),
    cacheKey,
    model: 'gemini-1.5-pro',
    visualizationId,
    userContext,
  };
  
  // Save to cache
  await saveToCache(cacheKey, personalizedContent);
  
  return personalizedContent;
}

async function personalizeWithGemini(
  genAI: GoogleGenerativeAI,
  template: VisualizationTemplate,
  userContext: any
): Promise<PersonalizedStep[]> {
  const sport = formatSportName(userContext.sport);
  const trackFieldEvent = userContext.trackFieldEvent;
  
  // Build context about the user's sport
  let sportContext = sport;
  let sportDetails = SPORT_CONTEXTS.general;
  
  if (sport === 'Track and Field' && trackFieldEvent) {
    const eventKey = mapTrackFieldEventToContext(trackFieldEvent);
    sportContext = `Track and Field (${formatTrackFieldEvent(trackFieldEvent)})`;
    sportDetails = SPORT_CONTEXTS[eventKey] || SPORT_CONTEXTS['track-and-field'];
  } else if (sport === 'Dance') {
    sportDetails = SPORT_CONTEXTS.dance;
  } else {
    const sportKey = sport.toLowerCase().replace(/[\\s-]/g, '_');
    sportDetails = SPORT_CONTEXTS[sportKey] || SPORT_CONTEXTS.general;
  }

  const prompt = `You are personalizing a mental training visualization for an athlete.

ATHLETE PROFILE:
- Sport: ${sportContext}
- Experience: Dedicated athlete seeking mental performance improvement

SPORT-SPECIFIC CONTEXT:
- Equipment: ${sportDetails.equipment.join(', ')}
- Environments: ${sportDetails.environments.join(', ')}
- Mental Challenges: ${sportDetails.mentalChallenges.join(', ')}
- Key Movements: ${sportDetails.movements.join(', ')}

VISUALIZATION: ${template.title}
Category: ${template.category}
Description: ${template.description}

PERSONALIZATION GUIDELINES:
1. Replace generic references with sport-specific scenarios
2. Use actual equipment names from the sport context above
3. Reference real movements and techniques from their sport
4. Include sport-specific environments listed above
5. Address the mental challenges specific to their sport
6. Maintain the emotional journey and timing of each step
7. Use a calm, confident, and empowering tone - speak directly to the athlete
8. Make the language vivid and immersive - help them truly visualize the experience
9. Include specific sensory details (what they see, hear, feel)
10. Ensure smooth transitions between steps

TONE REQUIREMENTS:
- Speak in second person ("you feel", "you see", "you perform")
- Use present tense for immediacy ("you are stepping", not "you will step")
- Be encouraging and confidence-building
- Include specific technical details relevant to their sport
- Create a sense of mastery and control

For each template below, create a personalized version that:
- Maintains the same psychological purpose and structure
- Uses concrete, vivid sport-specific imagery with sensory details
- Keeps similar duration (can vary ±10%)
- Flows naturally from step to step
- Feels authentic to someone who participates in ${sportContext}
- Builds confidence and mental strength
- Includes specific performance cues relevant to their sport

Templates to personalize:
${template.steps.map((step, i) => `Step ${i + 1}: ${step.content}`).join('\n\n')}

Return a JSON object with an array called "steps", where each step contains:
- "content": the personalized script text (2-4 sentences, vivid and specific)
- "duration": suggested duration in seconds (integer)
- "sportElements": array of 2-3 specific sport terms you incorporated`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Clean response to extract JSON
    const jsonMatch = response.match(/\\{[\\s\\S]*\\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    const steps = parsed.steps || [];

    if (steps.length === 0) {
      throw new Error('No steps generated');
    }

    return steps.map((step: any, index: number) => ({
      content: step.content || template.steps[index].content,
      duration: step.duration || template.steps[index].duration,
      emphasis: 'normal',
      personalizedElements: step.sportElements || [`Adapted for ${sportContext}`],
    }));
  } catch (error) {
    console.error('Gemini personalization failed:', error);
    // Return original steps as fallback
    return template.steps.map(step => ({
      content: step.content,
      duration: step.duration,
      emphasis: 'normal',
      personalizedElements: [],
    }));
  }
}

// Helper functions
function generateCacheKey(visualizationId: string, userContext: any): string {
  const contextString = `${visualizationId}|${userContext.sport || ''}|${userContext.trackFieldEvent || ''}`;
  return crypto.createHash('sha256').update(contextString).digest('hex').substring(0, 16);
}

async function getCachedPersonalization(cacheKey: string): Promise<PersonalizedContent | null> {
  try {
    const doc = await getFirestore().collection('personalized_content').doc(cacheKey).get();
    if (doc.exists) {
      return doc.data() as PersonalizedContent;
    }
  } catch (error) {
    console.error('Cache retrieval error:', error);
  }
  return null;
}

async function saveToCache(cacheKey: string, content: PersonalizedContent): Promise<void> {
  try {
    await getFirestore().collection('personalized_content').doc(cacheKey).set(content);
  } catch (error) {
    console.error('Cache save error:', error);
  }
}

async function getVisualizationTemplate(visualizationId: string): Promise<VisualizationTemplate | null> {
  try {
    const doc = await getFirestore().collection('visualizations').doc(visualizationId).get();
    if (doc.exists) {
      return doc.data() as VisualizationTemplate;
    }
  } catch (error) {
    console.error('Template retrieval error:', error);
  }
  return null;
}

// Format helpers
function formatSportName(sport?: string): string {
  if (!sport) return 'General Athletics';
  
  const sportMap: Record<string, string> = {
    'track-and-field': 'Track and Field',
    'other': 'General Athletics',
  };
  
  return sportMap[sport] || sport;
}

function formatTrackFieldEvent(event: string): string {
  const eventMap: Record<string, string> = {
    'sprints-100m': '100m Sprint',
    'sprints-200m': '200m Sprint',
    'running-all-distances': 'Distance Running',
    'high-jump': 'High Jump',
    'pole-vault': 'Pole Vault',
    'long-triple-jump': 'Long Jump/Triple Jump',
    'throws-all': 'Throws',
  };
  
  return eventMap[event] || event;
}

function mapTrackFieldEventToContext(event: string): string {
  const contextMap: Record<string, string> = {
    'sprints-100m': 'sprinting',
    'sprints-200m': 'sprinting',
    'running-all-distances': 'distance_running',
    'high-jump': 'high_jump',
    'pole-vault': 'pole_vault',
    'long-triple-jump': 'horizontal_jumps',
    'throws-all': 'throws',
  };
  
  return contextMap[event] || 'track-and-field';
}