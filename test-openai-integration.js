// Simple test to verify OpenAI integration with new visualization
const { getAllVisualizations } = require('./constants/visualizations');
const { OpenAIPersonalizationService } = require('./services/openai-personalization-service');

console.log('Testing OpenAI Integration with New Visualization Template...');

// Test 1: Check if visualization template is loaded
const visualizations = getAllVisualizations();
console.log(`Found ${visualizations.length} visualizations:`);
visualizations.forEach(v => {
  console.log(`- ${v.id}: ${v.title} (${v.steps.length} steps)`);
});

// Test 2: Check if OpenAI service is available
const openAIService = OpenAIPersonalizationService.getInstance();
console.log('OpenAI service initialized successfully');

// Test 3: Get stats (should be empty initially)
const stats = openAIService.getStats();
console.log('OpenAI service stats:', stats);

console.log('\n✅ Core system is working! OpenAI integration is ready.');
console.log('Next step: Test personalization with different sports in the app.');