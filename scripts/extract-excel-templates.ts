#!/usr/bin/env node

import { ExcelTemplateExtractor } from '../utils/excel-parser';
import * as path from 'path';

async function main() {
  const command = process.argv[2];
  const projectRoot = path.resolve(__dirname, '..');
  const inputDir = path.join(projectRoot, 'data/personalization/excel');
  const outputDir = path.join(projectRoot, 'data/personalization/cleaned');
  const templateDir = path.join(projectRoot, 'data/personalization/templates');

  const extractor = new ExcelTemplateExtractor(templateDir);

  switch (command) {
    case 'extract':
      console.log('Extracting templates from Excel files...');
      console.log('Input directory:', inputDir);
      console.log('Output directory:', templateDir);
      
      await extractor.extractAllTemplates(inputDir);
      break;
    
    case 'clean':
      console.log('Cleaning Excel files (removing sport-specific columns)...');
      console.log('Input directory:', inputDir);
      console.log('Output directory:', outputDir);
      
      await extractor.cleanExcelFiles(inputDir, outputDir);
      break;
    
    default:
      console.log('Usage:');
      console.log('  Extract templates: bun run scripts/extract-excel-templates.ts extract');
      console.log('  Clean Excel files: bun run scripts/extract-excel-templates.ts clean');
      console.log('');
      console.log('Commands:');
      console.log('  extract - Extract template columns from Excel files and save as JSON');
      console.log('  clean   - Remove sport-specific columns from Excel files');
  }
}

main().catch(console.error);