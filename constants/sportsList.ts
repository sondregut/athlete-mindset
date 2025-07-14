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

// Popular sports that should appear first
const popularSportsList = [
  'Running', 'Basketball', 'Soccer', 'Tennis', 'Swimming',
  'Weightlifting', 'CrossFit', 'Yoga', 'Golf', 'Cycling',
  'Track & Field', 'Baseball', 'Football', 'Volleyball',
  'Boxing', 'MMA', 'Dance', 'Gymnastics', 'Hockey', 'Skiing'
];

// Additional sports not in popular list
const additionalSports = [
  'Marathon Running', 'Powerlifting', 'Triathlon', 
  'Rock Climbing', 'Martial Arts', 'Pilates', 'Surfing',
  'Skateboarding', 'Snowboarding', 'Wrestling', 'Judo',
  'Karate', 'Taekwondo', 'Fencing', 'Archery', 'Rowing',
  'Sailing', 'Rugby', 'Cricket', 'Badminton', 'Table Tennis',
  'Squash', 'Handball', 'Water Polo', 'Field Hockey',
  'Ice Hockey', 'Figure Skating', 'Speed Skating',
  'Bobsled', 'Luge', 'Biathlon', 'Nordic Skiing',
  'Alpine Skiing', 'Freestyle Skiing', 'Lacrosse',
  'Ultimate Frisbee', 'Disc Golf', 'Bowling', 'Darts',
  'Pool/Billiards', 'Chess', 'eSports', 'Parkour',
  'Cheerleading', 'Bouldering', 'Calisthenics',
  'Functional Fitness', 'Strongman', 'Olympic Weightlifting',
  'Bodybuilding', 'Pole Dancing', 'Aerial Arts',
  'Acrobatics', 'Trampolining', 'Tumbling'
];

// Create comprehensive sports list
const allGeneralSports: SportItem[] = [
  ...popularSportsList.map(sport => ({
    id: sport.toLowerCase().replace(/\s+/g, '-'),
    label: sport,
    value: sport,
    icon: sportOptions.find(s => s.label === sport)?.icon
  })),
  ...additionalSports.map(sport => ({
    id: sport.toLowerCase().replace(/\s+/g, '-'),
    label: sport,
    value: sport
  }))
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