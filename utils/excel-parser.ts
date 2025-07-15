import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

interface ParsedPersonalizationData {
  [visualizationId: string]: {
    [stepNumber: string]: {
      template: string;
      [sport: string]: string;
    };
  };
}

export class ExcelPersonalizationParser {
  private outputDir: string;
  
  constructor(outputDir: string = './data/personalization/parsed') {
    this.outputDir = outputDir;
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * Parse all Excel files in the input directory and generate a combined JSON file
   */
  async parseAllExcelFiles(inputDir: string): Promise<void> {
    const files = fs.readdirSync(inputDir).filter(file => 
      file.endsWith('.xlsx') || file.endsWith('.xls')
    );

    const combinedData: ParsedPersonalizationData = {};

    for (const file of files) {
      const filePath = path.join(inputDir, file);
      const visualizationId = path.basename(file, path.extname(file));
      
      console.log(`Parsing Excel file: ${file}`);
      const data = await this.parseExcelFile(filePath, visualizationId);
      
      if (data) {
        combinedData[visualizationId] = data;
      }
    }

    // Write combined data to JSON
    const outputPath = path.join(this.outputDir, 'personalization-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(combinedData, null, 2));
    
    console.log(`✅ Generated personalization data at: ${outputPath}`);
    console.log(`   Visualizations: ${Object.keys(combinedData).length}`);
    console.log(`   Sports covered: ${this.getUniqueSports(combinedData).join(', ')}`);
  }

  /**
   * Parse a single Excel file
   */
  private parseExcelFile(filePath: string, visualizationId: string): any {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (jsonData.length < 2) {
        console.error(`No data found in ${filePath}`);
        return null;
      }

      // First row contains headers
      const headers = jsonData[0] as string[];
      const stepIdIndex = headers.findIndex(h => 
        h?.toLowerCase().includes('step') && h?.toLowerCase().includes('id')
      );
      const templateIndex = headers.findIndex(h => 
        h?.toLowerCase().includes('template')
      );

      if (stepIdIndex === -1 || templateIndex === -1) {
        console.error(`Required columns not found in ${filePath}`);
        return null;
      }

      // Parse sport columns (everything after template column)
      const sportColumns: { index: number; name: string }[] = [];
      for (let i = templateIndex + 1; i < headers.length; i++) {
        if (headers[i]) {
          sportColumns.push({
            index: i,
            name: this.normalizeSportName(headers[i])
          });
        }
      }

      // Parse data rows
      const result: any = {};
      
      for (let rowIndex = 1; rowIndex < jsonData.length; rowIndex++) {
        const row = jsonData[rowIndex];
        const stepId = this.extractStepNumber(row[stepIdIndex]);
        
        if (stepId === null) continue;
        
        result[stepId] = {
          template: row[templateIndex] || '',
        };

        // Add sport-specific content
        for (const sport of sportColumns) {
          const content = row[sport.index];
          if (content && content.toString().trim()) {
            result[stepId][sport.name] = content.toString().trim();
          }
        }
      }

      return result;
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Extract step number from various formats (Step_1, Step 1, 1, etc.)
   */
  private extractStepNumber(value: any): string | null {
    if (!value) return null;
    
    const str = value.toString();
    const match = str.match(/\d+/);
    
    if (match) {
      // Convert to 0-based index
      return (parseInt(match[0]) - 1).toString();
    }
    
    return null;
  }

  /**
   * Normalize sport names to match the expected format
   */
  private normalizeSportName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  /**
   * Get unique sports from the combined data
   */
  private getUniqueSports(data: ParsedPersonalizationData): string[] {
    const sports = new Set<string>();
    
    Object.values(data).forEach(visualization => {
      Object.values(visualization).forEach(step => {
        Object.keys(step).forEach(key => {
          if (key !== 'template') {
            sports.add(key);
          }
        });
      });
    });
    
    return Array.from(sports).sort();
  }

  /**
   * Generate a sample Excel template for a visualization
   */
  static generateExcelTemplate(
    visualizationId: string,
    steps: string[],
    outputPath: string,
    sports: string[] = ['Pole Vault', 'Horizontal Jumps', 'High Jump', 'Distance Running', 'Sprinting', 'Throws']
  ): void {
    // Create worksheet data
    const wsData: any[][] = [];
    
    // Headers
    const headers = ['Step_ID', 'Template_Text', ...sports];
    wsData.push(headers);
    
    // Add steps
    steps.forEach((step, index) => {
      const row = [
        `Step_${index + 1}`,
        step,
        ...sports.map(() => '') // Empty cells for sports
      ];
      wsData.push(row);
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    const colWidths = [
      { wch: 10 }, // Step_ID
      { wch: 50 }, // Template_Text
      ...sports.map(() => ({ wch: 50 })) // Sport columns
    ];
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Personalization');
    
    // Write file
    XLSX.writeFile(wb, outputPath);
    console.log(`✅ Generated Excel template at: ${outputPath}`);
  }
}

// CLI usage
if (require.main === module) {
  const parser = new ExcelPersonalizationParser();
  const inputDir = process.argv[2] || './data/personalization/excel';
  
  parser.parseAllExcelFiles(inputDir)
    .then(() => console.log('✅ Parsing complete'))
    .catch(error => console.error('❌ Error:', error));
}