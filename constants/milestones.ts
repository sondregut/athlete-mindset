export interface Milestone {
  threshold: number;
  id: string;
  title: string;
  description: string;
  badgeColor: string;
  backgroundColor: string;
  icon: string;
  quotes: string[];
}

export const STREAK_MILESTONES: Milestone[] = [
  {
    threshold: 7,
    id: 'week-warrior',
    title: 'Week Warrior',
    description: 'Completed 7 days in a row!',
    badgeColor: '#CD7F32', // Bronze
    backgroundColor: '#CD7F3215',
    icon: '🏅',
    quotes: [
      "One week down, a lifetime to go! You're building something special.",
      "Seven days of dedication. You've proven you have what it takes.",
      "A week of consistency is the foundation of greatness.",
      "You're not just training your body, you're training your mind. Keep going!",
      "The first week is the hardest. You've conquered it!"
    ]
  },
  {
    threshold: 30,
    id: 'monthly-master',
    title: 'Monthly Master',
    description: 'Achieved a 30-day streak!',
    badgeColor: '#C0C0C0', // Silver
    backgroundColor: '#C0C0C015',
    icon: '🥈',
    quotes: [
      "30 days of excellence! You've turned training into a lifestyle.",
      "A month of dedication. Champions are built one day at a time.",
      "You've proven that consistency beats perfection. Keep crushing it!",
      "30 days stronger, mentally and physically. This is just the beginning.",
      "They say it takes 30 days to build a habit. You've built a champion's mindset."
    ]
  },
  {
    threshold: 100,
    id: 'century-champion',
    title: 'Century Champion',
    description: 'Incredible 100-day streak!',
    badgeColor: '#FFD700', // Gold
    backgroundColor: '#FFD70015',
    icon: '🏆',
    quotes: [
      "100 days of pure dedication! You're in elite company now.",
      "A century of consistency. You've become unstoppable.",
      "100 days proves one thing: you have the heart of a champion.",
      "Triple digits! Your commitment is inspiring others around you.",
      "You're not just an athlete, you're a warrior. 100 days of proof."
    ]
  },
  {
    threshold: 365,
    id: 'year-legend',
    title: 'Year of Excellence',
    description: 'Legendary 365-day streak!',
    badgeColor: '#E5E4E2', // Platinum
    backgroundColor: '#E5E4E215',
    icon: '👑',
    quotes: [
      "365 days. One full year. You've redefined what's possible.",
      "A year of unwavering commitment. You're not just an athlete, you're a legend.",
      "365 days of choosing growth over comfort. Absolutely legendary.",
      "One year, zero excuses. You've achieved what few dare to attempt.",
      "You've proven that excellence isn't an act, it's a habit. Incredible!"
    ]
  }
];

export const getNextMilestone = (currentStreak: number): Milestone | null => {
  return STREAK_MILESTONES.find(milestone => milestone.threshold > currentStreak) || null;
};

export const getCurrentMilestone = (currentStreak: number): Milestone | null => {
  // Find the highest milestone achieved
  let currentMilestone: Milestone | null = null;
  
  for (const milestone of STREAK_MILESTONES) {
    if (currentStreak >= milestone.threshold) {
      currentMilestone = milestone;
    } else {
      break;
    }
  }
  
  return currentMilestone;
};

export const getMilestoneById = (id: string): Milestone | undefined => {
  return STREAK_MILESTONES.find(milestone => milestone.id === id);
};

export const getRandomMilestoneQuote = (milestone: Milestone): string => {
  const randomIndex = Math.floor(Math.random() * milestone.quotes.length);
  return milestone.quotes[randomIndex];
};