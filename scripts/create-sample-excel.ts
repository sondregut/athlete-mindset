import { ExcelPersonalizationParser } from '../utils/excel-parser';
import { visualizations } from '../constants/visualizations';

// Find the peak performance sports visualization (the one with generic sport terms)
const peakPerformance = visualizations.find(v => v.id === 'peak-performance-sports');

if (peakPerformance) {
  const steps = peakPerformance.steps.map(step => step.content);
  
  // Generate template with the user's example sports
  ExcelPersonalizationParser.generateExcelTemplate(
    'peak-performance-sports',
    steps,
    './data/personalization/excel/peak-performance-sports.xlsx',
    ['Pole Vault', 'Horizontal Jumps', 'High Jump', 'Distance Running', 'Sprinting', 'Throws']
  );
  
  console.log('✅ Sample Excel template created!');
  console.log('📝 Now you can fill in the personalized content for each sport.');
} else {
  console.error('❌ Peak performance sports visualization not found');
}