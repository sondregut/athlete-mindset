#!/usr/bin/env bun
import * as XLSX from 'xlsx';
import * as path from 'path';
import { getAllVisualizations } from '../constants/visualizations';

// Create an example Excel file for peak-performance-sports with some filled content
const visualization = getAllVisualizations().find(v => v.id === 'peak-performance-sports');

if (!visualization) {
  console.error('❌ Could not find peak-performance-sports visualization');
  process.exit(1);
}

console.log('📝 Creating example personalization for peak-performance-sports\n');

// Define the worksheet data
const wsData: any[][] = [];

// Headers
const headers = [
  'Step_ID', 
  'Template_Text',
  'pole_vault',
  'sprinting',
  'basketball',
  'swimming',
  'distance_running',
  'horizontal_jumps'
];
wsData.push(headers);

// Example personalizations for each step
const personalizations = [
  {
    template: visualization.steps[0].content,
    pole_vault: "Take a moment to think about an area in pole vaulting that you want to refine or improve. This could be your run-up speed, pole plant timing, or clearing a specific height.",
    sprinting: "Take a moment to think about an area in sprinting that you want to refine or improve. This could be your start technique, acceleration phase, or maintaining top-end speed.",
    basketball: "Take a moment to think about an area in basketball that you want to refine or improve. This could be your shooting form, defensive footwork, or court vision.",
    swimming: "Take a moment to think about an area in swimming that you want to refine or improve. This could be your stroke technique, flip turns, or race pacing.",
    distance_running: visualization.steps[0].content, // Keep template
    horizontal_jumps: visualization.steps[0].content  // Keep template
  },
  {
    template: visualization.steps[1].content,
    // All sports use the same template for this step
    pole_vault: visualization.steps[1].content,
    sprinting: visualization.steps[1].content,
    basketball: visualization.steps[1].content,
    swimming: visualization.steps[1].content,
    distance_running: visualization.steps[1].content,
    horizontal_jumps: visualization.steps[1].content
  },
  {
    template: visualization.steps[2].content,
    pole_vault: "Start by mentally immersing yourself in the environment where you'll perform. Imagine every detail - the runway, the pit, the standards holding the bar at your target height. Notice the wind conditions, temperature, and feel of the pole in your hands.",
    sprinting: "Start by mentally immersing yourself in the environment where you'll perform. Imagine every detail - the track surface, your lane, the starting blocks beneath your feet. Notice the stadium atmosphere, temperature, and the feel of the track.",
    basketball: "Start by mentally immersing yourself in the environment where you'll perform. Imagine every detail - the court, the hoops, the three-point line, and the key. Notice the sounds of sneakers squeaking, the ball bouncing, and the crowd.",
    swimming: "Start by mentally immersing yourself in the environment where you'll perform. Imagine every detail - the pool, the lane lines, the starting blocks, and the water temperature. Notice the chlorine smell and the echo of the natatorium.",
    distance_running: "Start by mentally immersing yourself in the environment where you'll perform. Imagine every detail - the track or road surface, the course layout, and the weather conditions. Notice your breathing rhythm and the feel of your stride.",
    horizontal_jumps: "Start by mentally immersing yourself in the environment where you'll perform. Imagine every detail - the runway, the takeoff board, and the sand pit. Notice the wind conditions and the feel of the track beneath your spikes."
  },
  {
    template: visualization.steps[3].content,
    pole_vault: "Start to see yourself performing the vault perfectly. Visualize your approach run building speed, the precise pole plant, the powerful takeoff, and your body inverting as you clear the bar. Picture your technique in detail - your grip, body position, and the smooth release at the peak.",
    sprinting: "Start to see yourself performing the sprint perfectly. Visualize your explosive start from the blocks, your acceleration phase with powerful arm drive, and your upright sprinting form at top speed. Picture every phase - drive phase, transition, and maintaining speed to the finish.",
    basketball: visualization.steps[3].content, // Keep mostly template
    swimming: visualization.steps[3].content,     // Keep mostly template
    distance_running: visualization.steps[3].content,
    horizontal_jumps: visualization.steps[3].content
  },
  {
    template: visualization.steps[4].content,
    // All sports use similar content with minor adjustments
    pole_vault: visualization.steps[4].content,
    sprinting: visualization.steps[4].content,
    basketball: visualization.steps[4].content,
    swimming: visualization.steps[4].content,
    distance_running: visualization.steps[4].content,
    horizontal_jumps: visualization.steps[4].content
  },
  {
    template: visualization.steps[5].content,
    pole_vault: "How does it feel in your body? Feel the explosive power in your legs at takeoff, the core strength as you invert, and the satisfaction of clearing the bar. See yourself overcoming any fear of height and trusting your technique.",
    sprinting: "How does it feel in your body? Feel the explosive power in your legs, the rhythm of your arms, and the speed flowing through you. See yourself maintaining relaxation at top speed and powering through to the finish.",
    basketball: visualization.steps[5].content,
    swimming: visualization.steps[5].content,
    distance_running: visualization.steps[5].content,
    horizontal_jumps: visualization.steps[5].content
  },
  {
    template: visualization.steps[6].content,
    // All use the same closing
    pole_vault: visualization.steps[6].content,
    sprinting: visualization.steps[6].content,
    basketball: visualization.steps[6].content,
    swimming: visualization.steps[6].content,
    distance_running: visualization.steps[6].content,
    horizontal_jumps: visualization.steps[6].content
  }
];

// Add rows
personalizations.forEach((row, index) => {
  const rowData = [
    `Step_${index + 1}`,
    row.template,
    row.pole_vault,
    row.sprinting,
    row.basketball,
    row.swimming,
    row.distance_running,
    row.horizontal_jumps
  ];
  wsData.push(rowData);
});

// Create workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(wsData);

// Set column widths for readability
const colWidths = [
  { wch: 10 },  // Step_ID
  { wch: 80 },  // Template_Text
  { wch: 80 },  // pole_vault
  { wch: 80 },  // sprinting
  { wch: 80 },  // basketball
  { wch: 80 },  // swimming
  { wch: 80 },  // distance_running
  { wch: 80 }   // horizontal_jumps
];
ws['!cols'] = colWidths;

XLSX.utils.book_append_sheet(wb, ws, 'Personalization');

// Write file
const outputPath = path.join(process.cwd(), 'data/personalization/excel/peak-performance-sports-EXAMPLE.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`✅ Created example Excel file at:\n   ${outputPath}`);
console.log('\n📋 This example shows:');
console.log('   - Some steps fully personalized (Steps 1, 3, 6)');
console.log('   - Some steps using template for all sports (Steps 2, 5, 7)');
console.log('   - Some sports with no changes (distance_running, horizontal_jumps)');
console.log('\n💡 To use this example:');
console.log('   1. Review and edit the content as needed');
console.log('   2. Save as peak-performance-sports.xlsx (remove -EXAMPLE)');
console.log('   3. Run: bun run utils/excel-parser.ts');
console.log('   4. The app will automatically use the personalized content!\n');