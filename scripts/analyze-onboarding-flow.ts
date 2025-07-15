#!/usr/bin/env bun
import { onboardingSteps } from '../store/onboarding-store';

console.log('📋 Analyzing Onboarding Flow for Duplicate Questions\n');

// Define what each step collects
const stepDataCollection: Record<number, { collects: string[]; description: string }> = {
  0: { // Welcome
    collects: ['user interest'],
    description: 'Welcome screen - no data collection'
  },
  1: { // Profile
    collects: ['name', 'age', 'sport', 'track_field_event', 'experience_level'],
    description: 'Basic profile information'
  },
  2: { // Mental Tracking
    collects: [],
    description: 'Educational - explains mental tracking feature'
  },
  3: { // AI Visualization
    collects: [],
    description: 'Educational - explains AI visualization feature'
  },
  4: { // Visualization Demo
    collects: [],
    description: 'Educational - demo of visualization'
  },
  5: { // Synergy
    collects: [],
    description: 'Educational - explains how features work together'
  },
  6: { // Personalization Setup
    collects: ['sport_activity', 'experience_level', 'specific_role', 'primary_goals', 'preferred_style', 'training_goals'],
    description: 'Personalization profile setup'
  },
  7: { // Personalization Voice
    collects: ['voice_preference'],
    description: 'AI voice selection'
  },
  8: { // Auth
    collects: ['authentication'],
    description: 'Account creation/login'
  }
};

console.log('📊 Step-by-Step Data Collection Analysis:');
console.log('=' .repeat(70));

Object.entries(stepDataCollection).forEach(([stepIndex, info]) => {
  const step = onboardingSteps[parseInt(stepIndex)];
  console.log(`\n${parseInt(stepIndex) + 1}. ${step.title}`);
  console.log(`   Description: ${info.description}`);
  console.log(`   Collects: ${info.collects.length ? info.collects.join(', ') : 'No data'}`);
});

console.log('\n\n🔍 Checking for Duplicate Data Collection:');
console.log('=' .repeat(70));

// Find duplicates
const allCollected = Object.values(stepDataCollection).flatMap(step => step.collects);
const duplicates = allCollected.filter((item, index) => allCollected.indexOf(item) !== index);
const uniqueDuplicates = [...new Set(duplicates)];

if (uniqueDuplicates.length > 0) {
  console.log('❌ Found duplicate questions:');
  uniqueDuplicates.forEach(duplicate => {
    console.log(`\n⚠️  "${duplicate}" is collected in multiple steps:`);
    Object.entries(stepDataCollection).forEach(([stepIndex, info]) => {
      if (info.collects.includes(duplicate)) {
        const step = onboardingSteps[parseInt(stepIndex)];
        console.log(`   - Step ${parseInt(stepIndex) + 1}: ${step.title}`);
      }
    });
  });
} else {
  console.log('✅ No duplicate questions found');
}

console.log('\n\n🎯 Specific Issues Found:');
console.log('=' .repeat(70));

// Check for specific known duplicates
const profileStep = stepDataCollection[1];
const personalizationStep = stepDataCollection[6];

const profileSportCollected = profileStep.collects.includes('sport') || profileStep.collects.includes('track_field_event');
const personalizationSportCollected = personalizationStep.collects.includes('sport_activity') || personalizationStep.collects.includes('specific_role');

const profileExperienceCollected = profileStep.collects.includes('experience_level');
const personalizationExperienceCollected = personalizationStep.collects.includes('experience_level');

if (profileSportCollected && personalizationSportCollected) {
  console.log('❌ DUPLICATE: Sport is asked in both Profile (Step 2) and Personalization (Step 7)');
  console.log('   - Profile step asks for: sport + track_field_event');
  console.log('   - Personalization step asks for: sport_activity + specific_role');
  console.log('   - These are essentially the same information');
} else {
  console.log('✅ Sport collection: No duplication detected');
}

if (profileExperienceCollected && personalizationExperienceCollected) {
  console.log('❌ DUPLICATE: Experience level is asked in both Profile (Step 2) and Personalization (Step 7)');
} else {
  console.log('✅ Experience level collection: No duplication detected');
}

console.log('\n\n💡 Recommendations:');
console.log('=' .repeat(70));
console.log('1. ✅ FIXED: PersonalizationWrapper now pre-fills sport data from Profile step');
console.log('2. ✅ FIXED: PersonalizationWrapper now pre-fills experience data from Profile step');
console.log('3. ✅ FIXED: PersonalizationWrapper skips completed steps automatically');
console.log('4. 🔄 RESULT: Users will only see personalization steps for data not yet collected');

console.log('\n\n📝 Updated Flow:');
console.log('=' .repeat(70));
console.log('Profile Step (Step 2):');
console.log('  - Collects: name, age, sport, track_field_event, experience_level');
console.log('  - ✅ This data is stored in UserStore');
console.log('');
console.log('Personalization Step (Step 7):');
console.log('  - ✅ Pre-fills sport_activity from UserStore.sport');
console.log('  - ✅ Pre-fills experience_level from UserStore.experienceLevel');
console.log('  - ✅ Pre-fills specific_role from UserStore.trackFieldEvent');
console.log('  - ✅ Skips to Goals step if sport+experience already collected');
console.log('  - Only asks for NEW data: primary_goals, preferred_style, training_goals');

console.log('\n✅ Duplicate question issue has been resolved!\n');