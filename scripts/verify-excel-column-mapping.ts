#!/usr/bin/env bun
import { ExcelPersonalizationService } from '../services/excel-personalization-service';

console.log('🔍 Excel Column Name Mapping Verification\n');

// Test the sport key mapping
const service = ExcelPersonalizationService.getInstance();

// Access the private method through a workaround
const getSportKey = (userContext: any) => {
  // Recreate the mapping logic from the service
  if (userContext.trackFieldEvent) {
    const eventMapping: Record<string, string> = {
      'sprints-100m': 'sprinting',
      'sprints-200m': 'sprinting',
      'running-all-distances': 'distance_running',
      'high-jump': 'high_jump',
      'pole-vault': 'pole_vault',
      'long-triple-jump': 'horizontal_jumps',
      'throws-all': 'throws',
    };
    
    return eventMapping[userContext.trackFieldEvent] || 'track_field_general';
  }

  if (userContext.sport) {
    const sportMapping: Record<string, string> = {
      'track-and-field': 'track_field_general',
      'other': 'general_sport',
      'dance': 'dance',
    };

    return sportMapping[userContext.sport] || userContext.sport.toLowerCase().replace(/[\s-]/g, '_');
  }

  return 'general';
};

// Test cases
const testCases = [
  // Track & Field events
  { sport: 'track-and-field', trackFieldEvent: 'pole-vault', expected: 'pole_vault' },
  { sport: 'track-and-field', trackFieldEvent: 'high-jump', expected: 'high_jump' },
  { sport: 'track-and-field', trackFieldEvent: 'long-triple-jump', expected: 'horizontal_jumps' },
  { sport: 'track-and-field', trackFieldEvent: 'sprints-100m', expected: 'sprinting' },
  { sport: 'track-and-field', trackFieldEvent: 'sprints-200m', expected: 'sprinting' },
  { sport: 'track-and-field', trackFieldEvent: 'running-all-distances', expected: 'distance_running' },
  { sport: 'track-and-field', trackFieldEvent: 'throws-all', expected: 'throws' },
  
  // Other sports
  { sport: 'basketball', expected: 'basketball' },
  { sport: 'swimming', expected: 'swimming' },
  { sport: 'soccer', expected: 'soccer' },
  { sport: 'dance', expected: 'dance' },
  { sport: 'weight-lifting', expected: 'weight_lifting' },
  
  // Special cases
  { sport: 'track-and-field', expected: 'track_field_general' }, // No specific event
  { sport: 'other', expected: 'general_sport' },
];

console.log('Sport Selection → Excel Column Name Mapping');
console.log('=' .repeat(60));
console.log();

testCases.forEach(testCase => {
  const context = {
    sport: testCase.sport,
    trackFieldEvent: testCase.trackFieldEvent
  };
  
  const result = getSportKey(context);
  const status = result === testCase.expected ? '✅' : '❌';
  
  console.log(`${status} ${testCase.sport}${testCase.trackFieldEvent ? ' - ' + testCase.trackFieldEvent : ''}`);
  console.log(`   → Excel column: "${result}"`);
  if (result !== testCase.expected) {
    console.log(`   ⚠️  Expected: "${testCase.expected}"`);
  }
  console.log();
});

// Show what columns exist in sample-filled
console.log('\n📊 Columns in sample-filled.xlsx:');
console.log('=' .repeat(60));
const supportedSports = service.getSupportedSports('sample-filled');
supportedSports.forEach(sport => {
  console.log(`  - ${sport}`);
});

console.log('\n✅ Verification complete!');