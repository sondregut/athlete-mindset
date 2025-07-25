#!/usr/bin/env node

const visualizationIds = [
  'batman-effect',
  'building-self-belief',
  'daily-rehearsal',
  'hope-resilience',
  'laser-focus',
  'letting-go',
  'outcome-visualization',
  'peak-performance-sports',
  'performance-excellence',
  'pre-competition',
  'public-speaking',
  'releasing-anxiety',
  'unstoppable-confidence'
];

const templateIds = [
  "batman-effect",
  "breath-awareness",
  "building-self-belief",
  "goal-visualization",
  "hope-resilience",
  "integrated-skill",
  "letting-go",
  "peak-performance-sports",
  "peak-performance-sports-EXAMPLE",
  "productivity-focus",
  "rehearsing-day",
  "releasing-anxiety",
  "sample-filled",
  "sports-fitness",
  "top-1-percent",
  "unstoppable-confidence"
];

console.log('Missing templates for these visualizations:');
visualizationIds.forEach(id => {
  if (!templateIds.includes(id)) {
    console.log(`- ${id}`);
  }
});

console.log('\nTemplates without corresponding visualizations:');
templateIds.forEach(id => {
  if (!visualizationIds.includes(id) && !id.includes('EXAMPLE')) {
    console.log(`- ${id}`);
  }
});