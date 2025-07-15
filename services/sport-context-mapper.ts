export type SportCategory = 
  | 'racing'
  | 'team-field'
  | 'team-court'
  | 'individual-performance'
  | 'combat'
  | 'target'
  | 'strength'
  | 'mindfulness'
  | 'water'
  | 'winter'
  | 'racquet'
  | 'other';

interface SportMapping {
  category: SportCategory;
  sports: string[];
  replacements: {
    [key: string]: string;
  };
}

export class SportContextMapper {
  private static sportCategories: { [sport: string]: SportCategory } = {
    // Only Track & Field sports
    'track & field': 'racing',
    'running': 'racing',
    'sprinting': 'racing',
    'pole vault': 'racing',
    'high jump': 'racing',
    'long jump': 'racing',
    'triple jump': 'racing',
    'throws': 'racing',
  };

  private static categoryMappings: SportMapping[] = [
    {
      category: 'racing',
      sports: ['running', 'sprinting', 'track & field', 'pole vault', 'high jump', 'long jump', 'triple jump', 'throws'],
      replacements: {
        'competition venue': 'track',
        'your performance': 'your event',
        'executing': 'competing',
        'crossing the finish line': 'completing your event',
        'completing your performance': 'finishing your event',
        'the environment': 'the track and field',
        'perform': 'compete',
      }
    },
  ];

  static getSportCategory(sport: string): SportCategory {
    const normalizedSport = sport.toLowerCase().trim();
    return this.sportCategories[normalizedSport] || 'other';
  }

  static getReplacements(sport: string): { [key: string]: string } {
    const category = this.getSportCategory(sport);
    const mapping = this.categoryMappings.find(m => m.category === category);
    return mapping?.replacements || {};
  }

  static getTrackFieldEventReplacements(event: string): { [key: string]: string } {
    const eventLower = event.toLowerCase();
    
    // Sprints
    if (eventLower.includes('sprint') || eventLower.includes('100m') || eventLower.includes('200m') || eventLower.includes('400m')) {
      return {
        'competition venue': 'track',
        'your performance': 'your sprint',
        'executing': 'sprinting',
        'crossing the finish line': 'crossing the finish line',
        'completing your performance': 'finishing your sprint',
        'the environment': 'the track',
        'perform': 'sprint',
      };
    }
    
    // All distance running
    if (eventLower.includes('running') || eventLower.includes('distance')) {
      return {
        'competition venue': 'track',
        'your performance': 'your race',
        'executing': 'running',
        'crossing the finish line': 'crossing the finish line',
        'completing your performance': 'finishing your race',
        'the environment': 'the track',
        'perform': 'run',
      };
    }
    
    // Hurdles
    if (eventLower.includes('hurdle')) {
      return {
        'competition venue': 'track',
        'your performance': 'your hurdle race',
        'executing': 'hurdling',
        'crossing the finish line': 'clearing the final hurdle and crossing the finish',
        'completing your performance': 'finishing your hurdle race',
        'the environment': 'the track',
        'perform': 'hurdle',
      };
    }
    
    // Jumps
    if (eventLower.includes('jump')) {
      return {
        'competition venue': 'jumping area',
        'your performance': 'your jump',
        'executing': 'jumping',
        'crossing the finish line': 'landing your final jump',
        'completing your performance': 'completing your jumps',
        'the environment': 'the runway',
        'perform': 'jump',
      };
    }
    
    // All Throws
    if (eventLower.includes('throw') || eventLower === 'throws-all') {
      return {
        'competition venue': 'throwing area',
        'your performance': 'your throw',
        'executing': 'throwing',
        'crossing the finish line': 'releasing your final throw',
        'completing your performance': 'finishing your throws',
        'the environment': 'the throwing circle',
        'perform': 'throw',
      };
    }
    
    // Pole vault
    if (eventLower.includes('pole vault')) {
      return {
        'competition venue': 'vault runway',
        'your performance': 'your vault',
        'executing': 'vaulting',
        'crossing the finish line': 'clearing the bar',
        'completing your performance': 'completing your vaults',
        'the environment': 'the runway',
        'perform': 'vault',
      };
    }
    
    // Default track and field
    return {
      'competition venue': 'track',
      'your performance': 'your event',
      'executing': 'competing',
      'crossing the finish line': 'completing your event',
      'completing your performance': 'finishing your event',
      'the environment': 'the track',
      'perform': 'compete',
    };
  }

  static getAllReplacementExamples(): string {
    const examples: string[] = [];
    
    this.categoryMappings.forEach(mapping => {
      const sportExample = mapping.sports[0];
      examples.push(`\n${sportExample.toUpperCase()}:`);
      Object.entries(mapping.replacements).forEach(([generic, specific]) => {
        examples.push(`- "${generic}" → "${specific}"`);
      });
    });
    
    return examples.join('\n');
  }
}