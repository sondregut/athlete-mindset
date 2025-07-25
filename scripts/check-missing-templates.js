#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load visualizations
const visualizationsFile = fs.readFileSync(path.join(__dirname, '../constants/visualizations.ts'), 'utf8');

// Extract visualization IDs using regex
const idMatches = visualizationsFile.match(/id:\s*'([^']+)'/g);
const visualizationIds = idMatches ? idMatches.map(match => match.replace(/id:\s*'|'/g, '')) : [];

// Load templates
const templatePath = path.join(__dirname, '../data/personalization/templates/visualization-templates.json');
const templates = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
const templateIds = Object.keys(templates);

console.log('🔍 Checking for visualizations without templates...\n');

// Find visualizations without templates
const missingTemplates = visualizationIds.filter(id => !templateIds.includes(id));
const extraTemplates = templateIds.filter(id => !visualizationIds.includes(id));

if (missingTemplates.length > 0) {
  console.log('❌ Visualizations defined but missing templates:');
  missingTemplates.forEach(id => console.log(`   - ${id}`));
  console.log('');
}

if (extraTemplates.length > 0) {
  console.log('⚠️  Templates exist but no visualization defined:');
  extraTemplates.forEach(id => console.log(`   - ${id}`));
  console.log('');
}

if (missingTemplates.length === 0 && extraTemplates.length === 0) {
  console.log('✅ All visualizations have matching templates!');
}

console.log('\n📊 Summary:');
console.log(`   Visualizations defined: ${visualizationIds.length}`);
console.log(`   Templates available: ${templateIds.length}`);
console.log(`   Missing templates: ${missingTemplates.length}`);
console.log(`   Extra templates: ${extraTemplates.length}`);