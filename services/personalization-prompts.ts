import { UserContext, ContextualFactors, PersonalizationRequest } from '@/types/personalization';

export class PersonalizationPrompts {
  static generateSystemPrompt(): string {
    return `You are an expert sports psychologist and visualization coach specializing in creating personalized mental training content for athletes. Your role is to adapt generic visualization scripts to be highly specific and relevant to each athlete's sport, experience level, and current context.

Key guidelines:
1. Use sport-specific terminology and scenarios
2. Reference relevant muscle groups, movements, and techniques
3. Include sensory details specific to their sport environment
4. Adapt complexity based on experience level
5. Maintain the original structure and timing
6. Keep language positive, present-tense, and action-oriented
7. Be concise but impactful - every word should serve a purpose

You will receive the athlete's profile and base content, then personalize it while maintaining the core message and duration.`;
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
    
    // Add base content
    prompt += `\nBASE VISUALIZATION CONTENT:\n`;
    baseContent.forEach((step, index) => {
      prompt += `${index + 1}. ${step}\n`;
    });
    
    // Add instructions
    prompt += `\nINSTRUCTIONS:
1. Personalize each step to be specific to their sport and context
2. Include relevant sensory details (sounds, feelings, environment)
3. Use appropriate technical terms for their sport
4. Maintain the same number of steps and approximate length
5. Keep the core message and progression of each step
6. Return ONLY the personalized steps as a numbered list
7. Do not include any explanations or metadata`;
    
    return prompt;
  }

  static formatSportName(sport: string): string {
    const sportNames: Record<string, string> = {
      'track-and-field': 'Track and Field',
      'football-american': 'American Football',
      'football-soccer': 'Soccer/Football',
      'hockey-field': 'Field Hockey',
      'hockey-ice': 'Ice Hockey',
      'martial-arts': 'Martial Arts',
      'table-tennis': 'Table Tennis',
      'water-polo': 'Water Polo',
    };
    
    return sportNames[sport] || sport.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  static formatTrackFieldEvent(event: string): string {
    const eventNames: Record<string, string> = {
      'sprints-100m': '100m Sprint',
      'sprints-200m': '200m Sprint',
      'sprints-400m': '400m Sprint',
      'middle-distance-800m': '800m',
      'middle-distance-1500m': '1500m',
      'middle-distance-mile': 'Mile',
      'long-distance-3000m': '3000m',
      'long-distance-5000m': '5000m',
      'long-distance-10000m': '10000m',
      'hurdles-100m': '100m Hurdles',
      'hurdles-110m': '110m Hurdles',
      'hurdles-400m': '400m Hurdles',
      'relay-4x100m': '4x100m Relay',
      'relay-4x400m': '4x400m Relay',
      'high-jump': 'High Jump',
      'pole-vault': 'Pole Vault',
      'long-jump': 'Long Jump',
      'triple-jump': 'Triple Jump',
      'shot-put': 'Shot Put',
      'race-walk': 'Race Walk',
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