#!/usr/bin/env node

/**
 * Helper script to create test profiles for personalization testing
 * Run this to see what profile data should look like
 */

const testProfiles = [
  {
    name: 'Sprint Test User',
    sport: 'track-and-field',
    trackFieldEvent: 'sprints-100m',
    experienceLevel: 'intermediate',
    primaryFocus: 'performance',
    goals: 'Improve sprint times and race strategy'
  },
  {
    name: 'High Jump Test User', 
    sport: 'track-and-field',
    trackFieldEvent: 'high-jump',
    experienceLevel: 'advanced',
    primaryFocus: 'consistency',
    goals: 'Perfect technique and mental preparation'
  },
  {
    name: 'Distance Test User',
    sport: 'track-and-field', 
    trackFieldEvent: 'running-all-distances',
    experienceLevel: 'beginner',
    primaryFocus: 'mindset',
    goals: 'Build endurance and mental toughness'
  }
];

console.log('🧪 Test User Profiles for Personalization Testing');
console.log('='.repeat(60));

testProfiles.forEach((profile, index) => {
  console.log(`\n${index + 1}. ${profile.name}`);
  console.log('   Profile Data:');
  Object.entries(profile).forEach(([key, value]) => {
    console.log(`     ${key}: ${value}`);
  });
});

console.log('\n📝 How to use these profiles:');
console.log('1. In the app, go to onboarding/profile setup');
console.log('2. Enter the data from one of these test profiles'); 
console.log('3. Open a visualization to test personalization');
console.log('4. Check console logs for personalization status');

console.log('\n🔍 Expected personalization differences:');
console.log('• Sprint user: Should see "track", "blocks", "explosive" terminology');
console.log('• High Jump user: Should see "bar", "approach", "takeoff" terminology');
console.log('• Distance user: Should see "pace", "endurance", "rhythm" terminology');

console.log('\n💡 Development tip:');
console.log('Look for the "AI" button in the visualization player header (dev mode only)');
console.log('to force regenerate personalization and see logs.');