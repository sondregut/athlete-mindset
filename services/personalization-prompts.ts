import { UserContext, ContextualFactors, PersonalizationRequest } from '@/types/personalization';
import { SportContextMapper } from './sport-context-mapper';

export class PersonalizationPrompts {
  static generateSystemPrompt(): string {
    return `You are an expert sports psychologist and visualization coach specializing in creating personalized mental training content for athletes. Your role is to make MINIMAL, TARGETED adaptations to generic visualization scripts by replacing only sport-specific terms.

CRITICAL INSTRUCTIONS:
1. PRESERVE 85-90% of the original content word-for-word
2. Replace ALL generic terms with sport-specific equivalents
3. IMPORTANT: When you see multiple options like "track, gym, field, court, or road" - replace with ONLY the single appropriate venue
4. DO NOT rewrite sentences or change the structure
5. DO NOT add new content or remove existing content
6. Maintain exact timing and flow of the original

MULTI-OPTION REPLACEMENTS (MUST replace with single option):
- "track, gym, field, court, or road" → Use ONLY the appropriate single venue
- "the track, pool, field, court, or road" → Use ONLY the appropriate single venue
- "running, playing, lifting" → Use ONLY the appropriate single action
- Any list of venues/actions → Pick ONLY the one that matches the sport

SPORT-SPECIFIC REPLACEMENT GUIDE:

RACING SPORTS (Running, Swimming, Cycling):
- "competition venue" → "track"
- "your performance" → "your race"
- "crossing the finish line" → "crossing the finish line"
- "completing your performance" → "finishing your race"

TEAM SPORTS (Basketball, Soccer, Volleyball):
- "competition venue" → "court" or "field"
- "your performance" → "your game"
- "crossing the finish line" → "hearing the final whistle/buzzer"
- "completing your performance" → "finishing the game"

STRENGTH SPORTS (Weightlifting, CrossFit):
- "competition venue" → "gym"
- "your performance" → "your lift"
- "crossing the finish line" → "completing your final rep"
- "completing your performance" → "finishing your set"

PERFORMANCE SPORTS (Gymnastics, Dance, Figure Skating):
- "competition venue" → "performance area"
- "your performance" → "your routine"
- "crossing the finish line" → "completing your routine"
- "executing" → "performing"

COMBAT SPORTS (Boxing, MMA, Wrestling):
- "competition venue" → "ring" or "mat"
- "your performance" → "your match"
- "crossing the finish line" → "hearing the final bell"
- "completing your performance" → "finishing the match"

MINDFULNESS SPORTS (Yoga, Pilates):
- "competition venue" → "studio"
- "your performance" → "your practice"
- "crossing the finish line" → "completing your final pose"
- "completing your performance" → "finishing your session"

Remember: The goal is subtle personalization, not complete rewriting. When in doubt, keep the original wording.`;
  }

  static generateUserPrompt(request: PersonalizationRequest): string {
    const { userContext, baseContent, contextualFactors, tone } = request;
    
    let prompt = `Personalize this visualization for an athlete with the following profile:\n\n`;
    
    // Add user context
    prompt += `ATHLETE PROFILE:\n`;
    if (userContext.sport) {
      // Use the sport name directly if it's a custom sport, otherwise format it
      const sportName = userContext.sport.includes(' ') || userContext.sport.length > 20 
        ? userContext.sport 
        : this.formatSportName(userContext.sport);
      prompt += `- Sport: ${sportName}`;
      if (userContext.trackFieldEvent) {
        prompt += ` (${userContext.trackFieldEvent})`;
      }
      prompt += '\n';
    }
    if (userContext.experienceLevel) {
      prompt += `- Experience Level: ${userContext.experienceLevel}\n`;
    }
    if (userContext.primaryFocus) {
      prompt += `- Current Focus: ${userContext.primaryFocus}\n`;
    }
    if (userContext.goals) {
      prompt += `- Goals: ${userContext.goals}\n`;
    }
    
    // Add contextual factors
    if (contextualFactors && Object.keys(contextualFactors).length > 0) {
      prompt += `\nCONTEXT:\n`;
      if (contextualFactors.timeUntilEvent) {
        prompt += `- Time until event: ${contextualFactors.timeUntilEvent}\n`;
      }
      if (contextualFactors.recentPerformance) {
        prompt += `- Recent performance: ${contextualFactors.recentPerformance}\n`;
      }
      if (contextualFactors.currentMood) {
        prompt += `- Current mood: ${contextualFactors.currentMood}\n`;
      }
      if (contextualFactors.location) {
        prompt += `- Location: ${contextualFactors.location}\n`;
      }
    }
    
    // Add tone preference
    prompt += `\nDESIRED TONE: ${tone || 'motivational'}\n`;
    
    // Add sport-specific replacements if available
    if (userContext.sport) {
      const sportName = userContext.sport.includes(' ') || userContext.sport.length > 20 
        ? userContext.sport 
        : this.formatSportName(userContext.sport);
      
      let replacements = SportContextMapper.getReplacements(sportName);
      
      // For track and field, get event-specific replacements
      if (userContext.trackFieldEvent) {
        replacements = SportContextMapper.getTrackFieldEventReplacements(userContext.trackFieldEvent);
      }
      
      if (Object.keys(replacements).length > 0) {
        prompt += `\nSPECIFIC REPLACEMENTS FOR ${sportName.toUpperCase()}:\n`;
        Object.entries(replacements).forEach(([generic, specific]) => {
          prompt += `- "${generic}" → "${specific}"\n`;
        });
      }
    }
    
    // Add base content
    prompt += `\nBASE VISUALIZATION CONTENT:\n`;
    baseContent.forEach((step, index) => {
      prompt += `${index + 1}. ${step}\n`;
    });
    
    // Add instructions
    prompt += `\nCRITICAL INSTRUCTIONS:
1. Make MINIMAL changes - preserve 90-95% of the original text
2. ONLY replace generic terms with sport-specific equivalents
3. DO NOT rewrite entire sentences or paragraphs
4. Maintain EXACT same number of steps and length
5. Keep the EXACT progression and core message
6. Return ONLY the personalized steps as a numbered list
7. Do not include any explanations or metadata

EXAMPLE OF CORRECT PERSONALIZATION:
Original: "Imagine every detail - whether it's the track, gym, field, court, or road."
For a sprinter: "Imagine every detail - the track."
For a pole vaulter: "Imagine every detail - the runway."
For a thrower: "Imagine every detail - the throwing circle."

Original: "Visualize yourself at the competition venue. See the environment clearly."
For a track sprinter: "Visualize yourself at the track. See the environment clearly."
For a high jumper: "Visualize yourself at the jump area. See the environment clearly."

EXAMPLE OF INCORRECT PERSONALIZATION:
Original: "whether it's the track, gym, field, court, or road"
WRONG for swimmer: "whether it's the track, gym, field, court, pool, or road" (added to list)
WRONG for swimmer: "whether it's the pool, track, gym, field, court, or road" (kept the list)
CORRECT for swimmer: "the pool" (replaced entire list with single venue)

Remember: Replace lists of options with the SINGLE appropriate term.`;
    
    return prompt;
  }

  static formatSportName(sport: string): string {
    const sportNames: Record<string, string> = {
      'track-and-field': 'Track and Field',
      'other': 'Other Sport',
    };
    
    return sportNames[sport] || sport.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  static formatTrackFieldEvent(event: string): string {
    const eventNames: Record<string, string> = {
      'sprints-100m': '100m Sprint',
      'sprints-200m': '200m Sprint',
      'running-all-distances': 'Running (All Distances)',
      'high-jump': 'High Jump',
      'pole-vault': 'Pole Vault',
      'long-triple-jump': 'Long/Triple Jump',
      'throws-all': 'All Throws',
    };
    
    return eventNames[event] || event.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  static parseResponse(response: string): string[] {
    // Parse numbered list response
    const lines = response.trim().split('\n');
    const steps: string[] = [];
    
    for (const line of lines) {
      // Match lines that start with a number followed by . or )
      const match = line.match(/^\d+[\.\)]\s*(.+)$/);
      if (match) {
        steps.push(match[1].trim());
      } else if (line.trim() && steps.length > 0) {
        // Continuation of previous step
        steps[steps.length - 1] += ' ' + line.trim();
      }
    }
    
    return steps;
  }

  static estimateDuration(content: string): number {
    // Estimate duration based on word count
    // Average speaking rate: 150 words per minute
    // Add padding for pauses and breathing
    const words = content.split(/\s+/).length;
    const minutes = words / 150;
    const seconds = Math.ceil(minutes * 60 * 1.2); // 20% padding
    return Math.max(seconds, 10); // Minimum 10 seconds per step
  }
}