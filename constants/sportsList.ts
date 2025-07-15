import { sportOptions, trackFieldEventOptions } from '@/store/user-store';

export interface SportItem {
  id: string;
  label: string;
  value: string;
  category?: string;
  icon?: string;
  isTrackEvent?: boolean;
  trackEventValue?: string;
}

// Only Track & Field sports
const popularSportsList = [
  'Track & Field'
];

// No additional sports - only Track & Field
const additionalSports: string[] = [];

// Create comprehensive sports list - only Track & Field
const allGeneralSports: SportItem[] = [
  {
    id: 'track-and-field',
    label: 'Track & Field',
    value: 'Track & Field',
    icon: sportOptions.find(s => s.label === 'Track & Field')?.icon || '🏃'
  }
];

// Create Track & Field events as individual items
const trackFieldSports: SportItem[] = trackFieldEventOptions.map(event => ({
  id: `track-field-${event.value}`,
  label: `Track & Field - ${event.label}`,
  value: 'Track & Field',
  category: event.category,
  icon: event.icon,
  isTrackEvent: true,
  trackEventValue: event.value
}));

// Combine all sports
export const allSports: SportItem[] = [
  ...allGeneralSports,
  ...trackFieldSports
];

// Function to search sports
export function searchSports(query: string, limit: number = 15): SportItem[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();
  
  // Filter and score results
  const results = allSports
    .map(sport => {
      const label = sport.label.toLowerCase();
      let score = 0;

      // Exact match
      if (label === searchTerm) {
        score = 100;
      }
      // Starts with search term
      else if (label.startsWith(searchTerm)) {
        score = 90;
      }
      // Contains search term at word boundary
      else if (label.split(/\s+/).some(word => word.startsWith(searchTerm))) {
        score = 80;
      }
      // Contains search term anywhere
      else if (label.includes(searchTerm)) {
        score = 70;
      }
      // For track events, also check the event name without "Track & Field -"
      else if (sport.isTrackEvent) {
        const eventName = sport.label.replace('Track & Field - ', '').toLowerCase();
        if (eventName.startsWith(searchTerm)) {
          score = 75;
        } else if (eventName.includes(searchTerm)) {
          score = 65;
        }
      }
      // Check category for track events
      else if (sport.category) {
        const category = sport.category.toLowerCase();
        if (category.includes(searchTerm)) {
          score = 60;
        }
      }

      return { sport, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ sport }) => sport);

  return results;
}

// Get icon for a sport
export function getSportIcon(sportName: string): string {
  const sport = allSports.find(s => s.label === sportName || s.value === sportName);
  return sport?.icon || '🏃';
}