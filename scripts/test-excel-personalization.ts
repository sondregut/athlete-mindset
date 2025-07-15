import { ExcelPersonalizationService } from '../services/excel-personalization-service';
import { PersonalizationRequest } from '../types/personalization';

async function testExcelPersonalization() {
  console.log('Testing Excel Personalization Service...\n');
  
  const service = ExcelPersonalizationService.getInstance();
  
  // Test case 1: Track and Field - Pole Vault
  const poleVaultRequest: PersonalizationRequest = {
    userContext: {
      sport: 'track-and-field' as any,
      trackFieldEvent: 'pole-vault' as any,
      experienceLevel: 'intermediate' as any,
    },
    visualizationId: 'sample-filled',
    visualizationTitle: 'Peak Performance Test',
    visualizationCategory: 'performance-process',
    baseContent: [
      'Find a comfortable position...',
      'Focus:',
      'Visualise the end result:',
      'Add details:',
      'Go deeper:',
      'Connect emotionally:',
      'Go bigger:',
      'Rehearse an action:',
      'Close with clarity:',
    ],
  };
  
  console.log('🏃 Test 1: Pole Vault Personalization');
  const poleVaultResult = await service.generatePersonalizedVisualization(poleVaultRequest);
  console.log('Step 2 (Focus):', poleVaultResult.steps[1].content);
  console.log('Step 5 (Go deeper):', poleVaultResult.steps[4].content);
  console.log('');
  
  // Test case 2: Sprinting
  const sprintingRequest: PersonalizationRequest = {
    userContext: {
      sport: 'track-and-field' as any,
      trackFieldEvent: 'sprints-100m' as any,
      experienceLevel: 'beginner' as any,
    },
    visualizationId: 'sample-filled',
    visualizationTitle: 'Peak Performance Test',
    visualizationCategory: 'performance-process',
    baseContent: poleVaultRequest.baseContent,
  };
  
  console.log('🏃 Test 2: Sprinting Personalization');
  const sprintingResult = await service.generatePersonalizedVisualization(sprintingRequest);
  console.log('Step 2 (Focus):', sprintingResult.steps[1].content);
  console.log('Step 3 (Visualise):', sprintingResult.steps[2].content);
  console.log('');
  
  // Test case 3: Sport not in Excel (should use fallback)
  const tennisRequest: PersonalizationRequest = {
    userContext: {
      sport: 'tennis' as any,
      experienceLevel: 'advanced' as any,
    },
    visualizationId: 'sample-filled',
    visualizationTitle: 'Peak Performance Test',
    visualizationCategory: 'performance-process',
    baseContent: poleVaultRequest.baseContent,
  };
  
  console.log('🎾 Test 3: Tennis (Fallback Test)');
  const tennisResult = await service.generatePersonalizedVisualization(tennisRequest);
  console.log('Step 2 (Should be template):', tennisResult.steps[1].content);
  console.log('');
  
  // Print stats
  const stats = service.getStats();
  console.log('📊 Service Stats:');
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Successful Matches: ${stats.successfulMatches}`);
  console.log(`Fallbacks Used: ${stats.fallbacks}`);
  console.log(`Hit Rate: ${stats.hitRate.toFixed(1)}%`);
  
  // Check supported sports
  console.log('\n🏅 Supported Sports for sample-filled:');
  const supportedSports = service.getSupportedSports('sample-filled');
  console.log(supportedSports.join(', '));
}

testExcelPersonalization()
  .then(() => console.log('\n✅ Test completed successfully!'))
  .catch(error => console.error('\n❌ Test failed:', error));