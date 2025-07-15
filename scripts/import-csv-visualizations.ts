import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';
import { ExcelPersonalizationParser } from '../utils/excel-parser';

interface VisualizationData {
  id: string;
  title: string;
  steps: string[];
}

// Map CSV visualization names to app visualization IDs
const visualizationMapping: Record<string, string> = {
  'GoalVisualisation': 'goal-visualization',
  'SelfBelief': 'building-self-belief',
  'UnstoppableConfidence': 'unstoppable-confidence',
  'Top1Percent': 'top-1-percent',
  'Productivity': 'productivity-focus',
  'SportsFitness': 'sports-fitness',
  'LettingGo': 'letting-go',
  'ReleasingAnxiety': 'releasing-anxiety',
  'BatmanEffect': 'batman-effect',
  'HopeResilience': 'hope-resilience',
  'RehearsingDay': 'rehearsing-day',
  'IntegratedSkill': 'integrated-skill',
  'BreathAttention': 'breath-awareness'
};

// Sports columns to add to each Excel file
const sportsColumns = [
  'Pole Vault',
  'Horizontal Jumps',
  'High Jump',
  'Distance Running',
  'Sprinting',
  'Throws',
  'Swimming',
  'Basketball',
  'Soccer',
  'Tennis',
  'Weightlifting',
  'Yoga'
];

function parseCsvData(csvPath: string): VisualizationData[] {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const visualizations: VisualizationData[] = [];
  let currentVisualization: VisualizationData | null = null;

  for (const record of records) {
    const stepId = (record as any)['Step_ID'];
    const templateText = (record as any)['Template_Text'];

    if (!stepId || !templateText) continue;

    // Check if this is a title row (contains _Title)
    if (stepId.includes('_Title')) {
      // Save previous visualization if exists
      if (currentVisualization && currentVisualization.steps.length > 0) {
        visualizations.push(currentVisualization);
      }

      // Start new visualization
      const prefix = stepId.split('_')[0];
      currentVisualization = {
        id: visualizationMapping[prefix] || prefix.toLowerCase(),
        title: templateText,
        steps: []
      };
    } else if (currentVisualization && !stepId.includes('_Track')) {
      // Add step to current visualization (skip track recommendations)
      currentVisualization.steps.push(templateText);
    }
  }

  // Don't forget the last visualization
  if (currentVisualization && currentVisualization.steps.length > 0) {
    visualizations.push(currentVisualization);
  }

  return visualizations;
}

function createExcelForVisualization(viz: VisualizationData, outputDir: string) {
  console.log(`Creating Excel for: ${viz.title} (${viz.id})`);
  
  // Create worksheet data
  const wsData: any[][] = [];
  
  // Headers
  const headers = ['Step_ID', 'Template_Text', ...sportsColumns];
  wsData.push(headers);
  
  // Add steps
  viz.steps.forEach((step, index) => {
    const row = [
      `Step_${index + 1}`,
      step,
      ...sportsColumns.map(() => '') // Empty cells for sports
    ];
    wsData.push(row);
  });

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  const colWidths = [
    { wch: 10 }, // Step_ID
    { wch: 80 }, // Template_Text (wider for these longer texts)
    ...sportsColumns.map(() => ({ wch: 60 })) // Sport columns
  ];
  ws['!cols'] = colWidths;
  
  XLSX.utils.book_append_sheet(wb, ws, 'Personalization');
  
  // Write file
  const outputPath = `${outputDir}/${viz.id}.xlsx`;
  XLSX.writeFile(wb, outputPath);
  console.log(`✅ Created: ${outputPath}`);
}

// Main execution
async function main() {
  const csvPath = '/Users/sondre_pv/Downloads/here are the  the vsualization without editing... - here are the  the vsualization without editing....csv';
  const outputDir = './data/personalization/excel';

  console.log('📄 Parsing CSV file...');
  const visualizations = parseCsvData(csvPath);
  
  console.log(`\n📊 Found ${visualizations.length} visualizations:`);
  visualizations.forEach(viz => {
    console.log(`  - ${viz.title} (${viz.steps.length} steps)`);
  });

  console.log('\n📝 Creating Excel templates...');
  visualizations.forEach(viz => {
    createExcelForVisualization(viz, outputDir);
  });

  console.log('\n✅ All Excel templates created!');
  console.log('\n📋 Next steps:');
  console.log('1. Fill in the sport-specific content in each Excel file');
  console.log('2. Run: bun run utils/excel-parser.ts ./data/personalization/excel');
  console.log('3. The personalizations will be available in the app');
}

main().catch(console.error);