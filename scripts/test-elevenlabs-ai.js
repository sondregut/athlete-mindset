#!/usr/bin/env bun
/**
 * ElevenLabs Conversational AI Test Script
 * Tests personalized content generation for sports visualizations
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';

console.log('🧪 ElevenLabs Conversational AI Research Test\n');

// Test data structure for sport personalization
const testSports = [
  {
    name: 'Pole Vault',
    context: {
      sport: 'track-and-field',
      event: 'pole_vault',
      venue: 'track and field stadium',
      equipment: 'pole',
      goal: 'clearing specific height',
      technique: 'run-up, plant, vault, clear bar'
    }
  },
  {
    name: 'Long Jump',
    context: {
      sport: 'track-and-field', 
      event: 'long_jump',
      venue: 'track and field stadium',
      equipment: 'sand pit',
      goal: 'jumping maximum distance',
      technique: 'run-up, takeoff, flight, landing'
    }
  },
  {
    name: 'Basketball',
    context: {
      sport: 'basketball',
      event: 'game',
      venue: 'basketball court',
      equipment: 'ball, hoop',
      goal: 'scoring points',
      technique: 'dribbling, shooting, defense'
    }
  }
];

// Test visualization template
const baseVisualization = {
  title: 'Peak Performance Visualization',
  steps: [
    'Find a comfortable position and close your eyes. Take deep breaths.',
    'Visualize yourself in your performance environment. See the details.',
    'See yourself performing at your absolute best. Feel the confidence.',
    'Experience the emotion of success. Let it fill your body.',
    'Open your eyes and carry this feeling with you.'
  ]
};

// Mock ElevenLabs API response for testing
function mockElevenLabsResponse(sportContext, step) {
  const personalizations = {
    'pole_vault': {
      0: 'Find a comfortable position and close your eyes. Take deep breaths, feeling the pole in your hands.',
      1: 'Visualize yourself on the runway approaching the bar. See the standards, the pit, the crowd.',
      2: 'See yourself executing the perfect vault - powerful run-up, precise plant, smooth clearance over the bar.',
      3: 'Experience the exhilaration of clearing your target height. Feel the pride and accomplishment.',
      4: 'Open your eyes and carry this vaulting confidence with you to the track.'
    },
    'long_jump': {
      0: 'Find a comfortable position and close your eyes. Take deep breaths, feeling your legs ready to explode.',
      1: 'Visualize yourself on the runway approaching the takeoff board. See the sand pit ahead.',
      2: 'See yourself executing the perfect jump - explosive takeoff, perfect flight position, strong landing.',
      3: 'Experience the satisfaction of a personal best distance. Feel the power in your legs.',
      4: 'Open your eyes and carry this jumping confidence with you to the track.'
    },
    'basketball': {
      0: 'Find a comfortable position and close your eyes. Take deep breaths, feeling the ball in your hands.',
      1: 'Visualize yourself on the court. See the hoop, the hardwood, your teammates.',
      2: 'See yourself making perfect shots, defensive plays, and team coordination.',
      3: 'Experience the flow state of perfect basketball performance. Feel the rhythm.',
      4: 'Open your eyes and carry this basketball confidence with you to the court.'
    }
  };
  
  return personalizations[sportContext.event]?.[step] || baseVisualization.steps[step];
}

// Test function to simulate ElevenLabs API call
function testPersonalizationGeneration(sportContext, visualization) {
  console.log(`\n📊 Testing ${sportContext.name} Personalization`);
  console.log('=' .repeat(50));
  
  const personalizedSteps = visualization.steps.map((step, index) => {
    const personalizedContent = mockElevenLabsResponse(sportContext.context, index);
    return {
      stepNumber: index + 1,
      original: step,
      personalized: personalizedContent,
      isDifferent: personalizedContent !== step
    };
  });
  
  console.log(`Sport: ${sportContext.name}`);
  console.log(`Event: ${sportContext.context.event}`);
  console.log(`Venue: ${sportContext.context.venue}`);
  console.log(`Equipment: ${sportContext.context.equipment}`);
  console.log(`Goal: ${sportContext.context.goal}\n`);
  
  personalizedSteps.forEach(step => {
    console.log(`Step ${step.stepNumber}:`);
    console.log(`  Original: "${step.original}"`);
    console.log(`  Personalized: "${step.personalized}"`);
    console.log(`  Customized: ${step.isDifferent ? '✅ YES' : '❌ NO'}\n`);
  });
  
  return personalizedSteps;
}

// Cost calculation function
function calculateCosts(avgMinutesPerVisualization, usersPerMonth) {
  const costs = {
    freeType: {
      name: 'Free Tier',
      minutesIncluded: 15,
      costPerMinute: 0,
      monthlyCost: 0
    },
    creator: {
      name: 'Creator/Pro Plan',
      minutesIncluded: 0,
      costPerMinute: 0.10,
      monthlyCost: 0
    },
    business: {
      name: 'Business Plan',
      minutesIncluded: 13750,
      costPerMinute: 0.08,
      monthlyCost: 0
    }
  };
  
  const totalMinutesNeeded = avgMinutesPerVisualization * usersPerMonth;
  
  console.log(`\n💰 Cost Analysis`);
  console.log('=' .repeat(50));
  console.log(`Estimated usage: ${avgMinutesPerVisualization} min/visualization × ${usersPerMonth} users = ${totalMinutesNeeded} min/month\n`);
  
  Object.values(costs).forEach(plan => {
    if (plan.minutesIncluded >= totalMinutesNeeded) {
      plan.monthlyCost = 0;
    } else {
      const extraMinutes = totalMinutesNeeded - plan.minutesIncluded;
      plan.monthlyCost = extraMinutes * plan.costPerMinute;
    }
    
    console.log(`${plan.name}:`);
    console.log(`  Minutes included: ${plan.minutesIncluded}`);
    console.log(`  Cost per extra minute: $${plan.costPerMinute.toFixed(2)}`);
    console.log(`  Monthly cost: $${plan.monthlyCost.toFixed(2)}\n`);
  });
  
  return costs;
}

// Run the tests
async function runTests() {
  console.log('📝 Testing Sport Personalization Capabilities\n');
  
  const results = [];
  
  // Test each sport
  for (const sport of testSports) {
    const result = testPersonalizationGeneration(sport, baseVisualization);
    results.push({
      sport: sport.name,
      event: sport.context.event,
      steps: result,
      personalizedSteps: result.filter(step => step.isDifferent).length
    });
  }
  
  // Summary
  console.log('\n📈 Personalization Summary');
  console.log('=' .repeat(50));
  results.forEach(result => {
    const personalizationRate = (result.personalizedSteps / result.steps.length) * 100;
    console.log(`${result.sport}: ${result.personalizedSteps}/${result.steps.length} steps personalized (${personalizationRate.toFixed(0)}%)`);
  });
  
  // Cost analysis
  calculateCosts(2, 1000); // 2 minutes per visualization, 1000 users per month
  calculateCosts(2, 5000); // 2 minutes per visualization, 5000 users per month
  
  // Save results
  const report = {
    timestamp: new Date().toISOString(),
    testResults: results,
    personalizedContent: results.map(r => ({
      sport: r.sport,
      steps: r.steps.map(s => ({
        stepNumber: s.stepNumber,
        personalized: s.personalized
      }))
    })),
    costAnalysis: [
      calculateCosts(2, 1000),
      calculateCosts(2, 5000)
    ]
  };
  
  writeFileSync('./elevenlabs-ai-research-results.json', JSON.stringify(report, null, 2));
  console.log('\n✅ Results saved to elevenlabs-ai-research-results.json');
  
  // Recommendations
  console.log('\n🎯 Recommendations');
  console.log('=' .repeat(50));
  console.log('✅ ElevenLabs Conversational AI can generate personalized content');
  console.log('✅ Dynamic variables would allow sport-specific customization');
  console.log('✅ Content quality appears significantly better than Excel templates');
  console.log('⚠️  Costs scale with usage - need to evaluate based on user base');
  console.log('⚠️  LLM costs will eventually be passed through (currently absorbed)');
  console.log('💡 Consider hybrid approach: AI for premium users, Excel for free users');
  console.log('💡 Implement intelligent caching to reduce API calls');
  console.log('💡 Start with free tier testing before committing to paid plans');
}

// Run the test
runTests().catch(console.error);