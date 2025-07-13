export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';

export type PrimaryGoal = 
  | 'build-confidence'
  | 'improve-performance'
  | 'reduce-anxiety'
  | 'enhance-focus'
  | 'increase-motivation'
  | 'handle-pressure'
  | 'prepare-competition'
  | 'improve-technique'
  | 'build-mental-toughness';

export type PreferredEnergyStyle = 
  | 'calm-peaceful'
  | 'high-energy'
  | 'laser-focused'
  | 'strong-powerful';

export interface PersonalizationProfile {
  id: string;
  name: string;
  sport_activity: string;
  experience_level: ExperienceLevel;
  specific_role?: string;
  primary_goals: PrimaryGoal[];
  preferred_style: PreferredEnergyStyle;
  completed_at: string;
  is_personalization_enabled: boolean;
}

export interface PersonalizationSetupState {
  currentStep: number;
  profile: Partial<PersonalizationProfile>;
  isCompleted: boolean;
}

export const goalOptions = [
  { 
    value: 'build-confidence' as PrimaryGoal, 
    label: 'Build Confidence',
    icon: '💪',
    description: 'Develop unshakeable self-belief'
  },
  { 
    value: 'improve-performance' as PrimaryGoal, 
    label: 'Improve Performance',
    icon: '📈',
    description: 'Reach new personal bests'
  },
  { 
    value: 'reduce-anxiety' as PrimaryGoal, 
    label: 'Reduce Anxiety',
    icon: '🧘',
    description: 'Stay calm under pressure'
  },
  { 
    value: 'enhance-focus' as PrimaryGoal, 
    label: 'Enhance Focus',
    icon: '🎯',
    description: 'Sharpen concentration'
  },
  { 
    value: 'increase-motivation' as PrimaryGoal, 
    label: 'Increase Motivation',
    icon: '🔥',
    description: 'Stay driven and energized'
  },
  { 
    value: 'handle-pressure' as PrimaryGoal, 
    label: 'Handle Pressure',
    icon: '💎',
    description: 'Thrive in big moments'
  },
  { 
    value: 'prepare-competition' as PrimaryGoal, 
    label: 'Prepare for Competition',
    icon: '🏆',
    description: 'Peak when it matters'
  },
  { 
    value: 'improve-technique' as PrimaryGoal, 
    label: 'Improve Technique',
    icon: '⚡',
    description: 'Perfect your form mentally'
  },
  { 
    value: 'build-mental-toughness' as PrimaryGoal, 
    label: 'Build Mental Toughness',
    icon: '🛡️',
    description: 'Develop resilience'
  },
];

export const energyStyleOptions = [
  {
    value: 'calm-peaceful' as PreferredEnergyStyle,
    label: 'Calm & Peaceful',
    icon: '🌊',
    description: 'Relaxed, centered, and grounded',
    color: '#4ECDC4',
  },
  {
    value: 'high-energy' as PreferredEnergyStyle,
    label: 'High Energy',
    icon: '⚡',
    description: 'Pumped up and ready to go',
    color: '#FF6B6B',
  },
  {
    value: 'laser-focused' as PreferredEnergyStyle,
    label: 'Laser Focused',
    icon: '🎯',
    description: 'Sharp, precise, and dialed in',
    color: '#4CAF50',
  },
  {
    value: 'strong-powerful' as PreferredEnergyStyle,
    label: 'Strong & Powerful',
    icon: '💪',
    description: 'Confident, dominant, unstoppable',
    color: '#FF9800',
  },
];

export const experienceLevelOptions = [
  {
    value: 'beginner' as ExperienceLevel,
    label: 'Beginner',
    description: 'Just starting out',
  },
  {
    value: 'intermediate' as ExperienceLevel,
    label: 'Intermediate',
    description: 'Some experience',
  },
  {
    value: 'advanced' as ExperienceLevel,
    label: 'Advanced',
    description: 'Very experienced',
  },
  {
    value: 'professional' as ExperienceLevel,
    label: 'Professional',
    description: 'Elite level',
  },
];