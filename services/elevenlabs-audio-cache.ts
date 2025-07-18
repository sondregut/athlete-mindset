import { getStorage, ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { TTSFirebaseCache } from './tts-firebase-cache';
import { ELEVENLABS_VOICES } from '@/config/elevenlabs-config';

interface CacheGenerationProgress {
  total: number;
  completed: number;
  currentSport: string;
  currentVoice: string;
  currentVisualization: string;
}

type ProgressCallback = (progress: CacheGenerationProgress) => void;

export class ElevenLabsAudioCache {
  private static instance: ElevenLabsAudioCache;
  private ttsService: TTSFirebaseCache;
  private storage = getStorage();
  
  private constructor() {
    this.ttsService = TTSFirebaseCache.getInstance();
  }
  
  static getInstance(): ElevenLabsAudioCache {
    if (!ElevenLabsAudioCache.instance) {
      ElevenLabsAudioCache.instance = new ElevenLabsAudioCache();
    }
    return ElevenLabsAudioCache.instance;
  }
  
  /**
   * Pre-generate all audio files for the 4 target sports and 3 voices
   */
  async preGenerateAllAudio(
    onProgress?: ProgressCallback
  ): Promise<Map<string, Map<string, Map<string, string>>>> {
    const targetSports = ['generic', 'pole-vault', 'soccer', 'distance-running'];
    const targetVoices = ['christina', 'mark', 'benjamin'];
    const visualizations = this.getVisualizationTemplates();
    
    const total = targetSports.length * targetVoices.length * visualizations.length;
    let completed = 0;
    
    const audioCache = new Map<string, Map<string, Map<string, string>>>();
    
    console.log(`[ElevenLabsAudioCache] Starting pre-generation of ${total} audio files...`);
    
    for (const sport of targetSports) {
      audioCache.set(sport, new Map());
      
      for (const voice of targetVoices) {
        audioCache.get(sport)!.set(voice, new Map());
        
        for (const visualization of visualizations) {
          try {
            onProgress?.({
              total,
              completed,
              currentSport: sport,
              currentVoice: voice,
              currentVisualization: visualization.id
            });
            
            const personalizedSteps = await this.generatePersonalizedSteps(sport, visualization);
            const audioUrls = await this.generateAudioForSteps(
              personalizedSteps,
              ELEVENLABS_VOICES[voice as keyof typeof ELEVENLABS_VOICES],
              sport,
              visualization.id
            );
            
            audioCache.get(sport)!.get(voice)!.set(visualization.id, JSON.stringify(audioUrls));
            completed++;
            
            console.log(`[ElevenLabsAudioCache] Generated ${sport}/${voice}/${visualization.id} (${completed}/${total})`);
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (error) {
            console.error(`[ElevenLabsAudioCache] Failed to generate ${sport}/${voice}/${visualization.id}:`, error);
            completed++;
          }
        }
      }
    }
    
    console.log(`[ElevenLabsAudioCache] Pre-generation complete: ${completed}/${total} files`);
    return audioCache;
  }
  
  private async generatePersonalizedSteps(sport: string, visualization: any): Promise<string[]> {
    const sportContexts = {
      'generic': {
        venue: 'performance environment',
        equipment: 'equipment',
        action: 'performing'
      },
      'pole-vault': {
        venue: 'track and field stadium',
        equipment: 'pole and standards',
        action: 'vaulting'
      },
      'soccer': {
        venue: 'soccer field',
        equipment: 'ball and goal',
        action: 'playing'
      },
      'distance-running': {
        venue: 'track or running route',
        equipment: 'running shoes',
        action: 'running'
      }
    };
    
    const context = sportContexts[sport as keyof typeof sportContexts] || sportContexts['generic'];
    
    return visualization.steps.map((step: string) => {
      // Apply minimal personalization
      return step
        .replace(/performance environment/g, context.venue)
        .replace(/equipment/g, context.equipment)
        .replace(/performing/g, context.action)
        .replace(/the track, gym, field, court, or road/g, context.venue);
    });
  }
  
  private async generateAudioForSteps(
    steps: string[],
    voiceId: string,
    sport: string,
    visualizationId: string
  ): Promise<{ [stepIndex: string]: string }> {
    const audioUrls: { [stepIndex: string]: string } = {};
    
    for (let i = 0; i < steps.length; i++) {
      try {
        const audioUrl = await this.ttsService.synthesizeSpeech(steps[i], {
          voice: voiceId,
          model: 'eleven_multilingual_v2',
          speed: 1.0,
          isPersonalized: sport !== 'generic'
        });
        
        audioUrls[i] = audioUrl;
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        console.error(`[ElevenLabsAudioCache] Failed to generate audio for step ${i}:`, error);
        throw error;
      }
    }
    
    return audioUrls;
  }
  
  /**
   * Get cached audio URL for a specific combination
   */
  async getCachedAudio(
    sport: string,
    voice: string,
    visualizationId: string,
    stepIndex: number
  ): Promise<string | null> {
    try {
      const cacheKey = `${sport}_${voice}_${visualizationId}_${stepIndex}`;
      const storageRef = ref(this.storage, `elevenlabs-audio-cache/${cacheKey}.mp3`);
      
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.log(`[ElevenLabsAudioCache] Cache miss for ${sport}/${voice}/${visualizationId}/${stepIndex}`);
      return null;
    }
  }
  
  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalFiles: number;
    sportsCount: number;
    voicesCount: number;
    visualizationsCount: number;
  }> {
    try {
      const cacheRef = ref(this.storage, 'elevenlabs-audio-cache/');
      const listResult = await listAll(cacheRef);
      
      const sports = new Set<string>();
      const voices = new Set<string>();
      const visualizations = new Set<string>();
      
      listResult.items.forEach(item => {
        const parts = item.name.replace('.mp3', '').split('_');
        if (parts.length >= 3) {
          sports.add(parts[0]);
          voices.add(parts[1]);
          visualizations.add(parts[2]);
        }
      });
      
      return {
        totalFiles: listResult.items.length,
        sportsCount: sports.size,
        voicesCount: voices.size,
        visualizationsCount: visualizations.size
      };
    } catch (error) {
      console.error('[ElevenLabsAudioCache] Error getting cache stats:', error);
      return {
        totalFiles: 0,
        sportsCount: 0,
        voicesCount: 0,
        visualizationsCount: 0
      };
    }
  }
  
  private getVisualizationTemplates() {
    // Sample visualization templates - in production, load from your actual visualizations
    return [
      {
        id: 'peak-performance-sports',
        steps: [
          'Find a comfortable position and close your eyes. Take deep breaths.',
          'Visualize yourself in your performance environment. See the details.',
          'See yourself performing at your absolute best. Feel the confidence.',
          'Experience the emotion of success. Let it fill your body.',
          'Open your eyes and carry this feeling with you.'
        ]
      },
      {
        id: 'batman-effect',
        steps: [
          'Choose your character: This can be a fictional character or someone who inspires you.',
          'Make a list of your character\'s attributes. Focus on their beliefs and energy.',
          'Prepare: Find a comfortable position and close your eyes.',
          'Build: Start by seeing the character version of you in your mind.',
          'Close with power: Take five more deep breaths and open your eyes.'
        ]
      },
      {
        id: 'unstoppable-confidence',
        steps: [
          'Prepare: Find a comfortable position and close your eyes.',
          'Build: Start by seeing the confident version of you in your mind.',
          'Create context: Take this vision and place them in situations you will be in.',
          'Mentally rehearse details: Start rehearsing how you would perform confidently.',
          'Close with confidence: Take five more deep breaths and open your eyes.'
        ]
      }
    ];
  }
}

export default ElevenLabsAudioCache;