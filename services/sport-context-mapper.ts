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
    // Racing sports
    'running': 'racing',
    'track & field': 'racing',
    'marathon running': 'racing',
    'cycling': 'racing',
    'swimming': 'racing',
    'triathlon': 'racing',
    'rowing': 'racing',
    'speed skating': 'racing',
    
    // Team field sports
    'soccer': 'team-field',
    'football': 'team-field',
    'rugby': 'team-field',
    'field hockey': 'team-field',
    'lacrosse': 'team-field',
    'ultimate frisbee': 'team-field',
    'cricket': 'team-field',
    
    // Team court sports
    'basketball': 'team-court',
    'volleyball': 'team-court',
    'handball': 'team-court',
    
    // Individual performance sports
    'gymnastics': 'individual-performance',
    'dance': 'individual-performance',
    'figure skating': 'individual-performance',
    'diving': 'individual-performance',
    'cheerleading': 'individual-performance',
    'pole dancing': 'individual-performance',
    'aerial arts': 'individual-performance',
    'acrobatics': 'individual-performance',
    'trampolining': 'individual-performance',
    
    // Combat sports
    'boxing': 'combat',
    'mma': 'combat',
    'wrestling': 'combat',
    'judo': 'combat',
    'karate': 'combat',
    'taekwondo': 'combat',
    'martial arts': 'combat',
    'fencing': 'combat',
    
    // Target sports
    'golf': 'target',
    'archery': 'target',
    'darts': 'target',
    'bowling': 'target',
    'disc golf': 'target',
    'pool/billiards': 'target',
    
    // Strength sports
    'weightlifting': 'strength',
    'powerlifting': 'strength',
    'crossfit': 'strength',
    'strongman': 'strength',
    'olympic weightlifting': 'strength',
    'bodybuilding': 'strength',
    'calisthenics': 'strength',
    'functional fitness': 'strength',
    
    // Mindfulness sports
    'yoga': 'mindfulness',
    'pilates': 'mindfulness',
    
    // Water sports
    'water polo': 'water',
    'surfing': 'water',
    'sailing': 'water',
    
    // Winter sports
    'skiing': 'winter',
    'snowboarding': 'winter',
    'ice hockey': 'winter',
    'bobsled': 'winter',
    'luge': 'winter',
    'biathlon': 'winter',
    'nordic skiing': 'winter',
    'alpine skiing': 'winter',
    'freestyle skiing': 'winter',
    
    // Racquet sports
    'tennis': 'racquet',
    'badminton': 'racquet',
    'table tennis': 'racquet',
    'squash': 'racquet',
    
    // Other
    'rock climbing': 'other',
    'bouldering': 'other',
    'skateboarding': 'other',
    'parkour': 'other',
    'chess': 'other',
    'esports': 'other',
    'tumbling': 'other',
  };

  private static categoryMappings: SportMapping[] = [
    {
      category: 'racing',
      sports: ['running', 'cycling', 'swimming'],
      replacements: {
        'competition venue': 'track',
        'your performance': 'your race',
        'executing': 'running',
        'crossing the finish line': 'crossing the finish line',
        'completing your performance': 'finishing your race',
        'the environment': 'the track',
        'perform': 'race',
      }
    },
    {
      category: 'team-field',
      sports: ['soccer', 'football', 'rugby'],
      replacements: {
        'competition venue': 'field',
        'your performance': 'your game',
        'executing': 'playing',
        'crossing the finish line': 'hearing the final whistle',
        'completing your performance': 'finishing the game',
        'the environment': 'the field',
        'perform': 'play',
      }
    },
    {
      category: 'team-court',
      sports: ['basketball', 'volleyball'],
      replacements: {
        'competition venue': 'court',
        'your performance': 'your game',
        'executing': 'playing',
        'crossing the finish line': 'hearing the final buzzer',
        'completing your performance': 'finishing the game',
        'the environment': 'the court',
        'perform': 'play',
      }
    },
    {
      category: 'individual-performance',
      sports: ['gymnastics', 'dance', 'figure skating'],
      replacements: {
        'competition venue': 'performance area',
        'your performance': 'your routine',
        'executing': 'performing',
        'crossing the finish line': 'completing your routine',
        'completing your performance': 'finishing your routine',
        'the environment': 'the performance space',
        'perform': 'execute your routine',
      }
    },
    {
      category: 'combat',
      sports: ['boxing', 'mma', 'martial arts'],
      replacements: {
        'competition venue': 'ring',
        'your performance': 'your fight',
        'executing': 'fighting',
        'crossing the finish line': 'hearing the final bell',
        'completing your performance': 'finishing the match',
        'the environment': 'the ring',
        'perform': 'fight',
      }
    },
    {
      category: 'target',
      sports: ['golf', 'archery'],
      replacements: {
        'competition venue': 'course',
        'your performance': 'your round',
        'executing': 'playing',
        'crossing the finish line': 'sinking the final putt',
        'completing your performance': 'finishing your round',
        'the environment': 'the course',
        'perform': 'play',
      }
    },
    {
      category: 'strength',
      sports: ['weightlifting', 'powerlifting'],
      replacements: {
        'competition venue': 'gym',
        'your performance': 'your lift',
        'executing': 'lifting',
        'crossing the finish line': 'completing your final rep',
        'completing your performance': 'finishing your set',
        'the environment': 'the gym',
        'perform': 'lift',
      }
    },
    {
      category: 'mindfulness',
      sports: ['yoga', 'pilates'],
      replacements: {
        'competition venue': 'studio',
        'your performance': 'your practice',
        'executing': 'practicing',
        'crossing the finish line': 'completing your final pose',
        'completing your performance': 'finishing your session',
        'the environment': 'the studio',
        'perform': 'practice',
      }
    },
    {
      category: 'water',
      sports: ['water polo', 'surfing'],
      replacements: {
        'competition venue': 'pool',
        'your performance': 'your match',
        'executing': 'playing',
        'crossing the finish line': 'hearing the final whistle',
        'completing your performance': 'finishing the match',
        'the environment': 'the pool',
        'perform': 'play',
      }
    },
    {
      category: 'winter',
      sports: ['skiing', 'ice hockey'],
      replacements: {
        'competition venue': 'slopes',
        'your performance': 'your run',
        'executing': 'skiing',
        'crossing the finish line': 'crossing the finish line',
        'completing your performance': 'completing your run',
        'the environment': 'the mountain',
        'perform': 'ski',
      }
    },
    {
      category: 'racquet',
      sports: ['tennis', 'badminton'],
      replacements: {
        'competition venue': 'court',
        'your performance': 'your match',
        'executing': 'playing',
        'crossing the finish line': 'winning match point',
        'completing your performance': 'finishing your match',
        'the environment': 'the court',
        'perform': 'play',
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
    
    // Distance running
    if (eventLower.includes('distance') || eventLower.includes('800m') || eventLower.includes('1500m') || eventLower.includes('5000m')) {
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
    
    // Throws
    if (eventLower.includes('throw') || eventLower.includes('shot') || eventLower.includes('discus') || eventLower.includes('javelin')) {
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