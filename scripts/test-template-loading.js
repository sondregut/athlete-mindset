#!/usr/bin/env node

/**
 * Simple test to verify template loading works
 */

const fs = require('fs');
const path = require('path');

// Load the templates directly
const templatePath = path.join(__dirname, '../data/personalization/templates/visualization-templates.json');

console.log('🔍 Testing Template Loading...\n');

try {
  const templateData = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  
  console.log(`✅ Successfully loaded templates from: ${templatePath}`);
  console.log(`📊 Found templates for ${Object.keys(templateData).length} visualizations\n`);
  
  // Check specific visualization
  const testVizId = 'batman-effect';
  const batmanTemplates = templateData[testVizId];
  
  if (batmanTemplates) {
    console.log(`✅ Found ${batmanTemplates.length} steps for ${testVizId}:`);
    
    // Show first 3 steps
    for (let i = 0; i < Math.min(3, batmanTemplates.length); i++) {
      const step = batmanTemplates[i];
      console.log(`\nStep ${step.stepNumber + 1}:`);
      console.log(`"${step.template.substring(0, 100)}..."`);
    }
  } else {
    console.log(`❌ No templates found for ${testVizId}`);
  }
  
  // List all available visualizations
  console.log('\n📋 All available visualizations with templates:');
  Object.keys(templateData).forEach(vizId => {
    const stepCount = templateData[vizId].length;
    console.log(`  - ${vizId}: ${stepCount} steps`);
  });
  
} catch (error) {
  console.error('❌ Error loading templates:', error.message);
}

console.log('\n✨ Test complete!');