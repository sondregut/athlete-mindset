# Excel-Based Personalization System

This system allows you to create personalized visualizations using Excel files instead of OpenAI API calls, eliminating API costs while maintaining quality control.

## How It Works

1. **Excel Files**: Create Excel files with personalized content for each sport
2. **Parse to JSON**: Convert Excel files to JSON for fast runtime access
3. **Local Service**: The app looks up personalized content from the JSON data

## Excel File Format

Each Excel file should have the following columns:

| Step_ID | Template_Text | Pole Vault | Horizontal Jumps | High Jump | Distance Running | Sprinting | Throws |
|---------|---------------|------------|------------------|-----------|------------------|-----------|---------|
| Step_1  | Original text | Personalized for pole vault | Personalized for jumps | ... | ... | ... | ... |
| Step_2  | Original text | Personalized content | Personalized content | ... | ... | ... | ... |

### Column Descriptions:
- **Step_ID**: Step number (Step_1, Step_2, etc.)
- **Template_Text**: The original/generic content
- **Sport Columns**: Add as many sport columns as needed

## Adding New Personalizations

### 1. Create/Edit Excel Files

Place Excel files in: `data/personalization/excel/`

File naming convention: `[visualization-id].xlsx`

Example: `peak-performance-sports.xlsx`

### 2. Generate Templates

To create a template for a visualization:

```bash
# Edit scripts/create-sample-excel.ts to specify your visualization
bun run scripts/create-sample-excel.ts
```

### 3. Fill in Personalized Content

Open the generated Excel file and fill in sport-specific content following these rules:
- Keep 80-90% of original content unchanged
- Replace generic terms (track/gym/field/court) with sport-specific venues
- Maintain the same structure and timing
- Don't add or remove content

### 4. Parse Excel to JSON

After filling in the Excel files:

```bash
bun run utils/excel-parser.ts ./data/personalization/excel
```

This generates: `data/personalization/parsed/personalization-data.json`

### 5. Test Your Personalizations

```bash
bun run scripts/test-excel-personalization.ts
```

## Sport Name Mapping

The system maps sport names to Excel column names:

### Track & Field Events:
- `sprints-100m` → `sprinting`
- `sprints-200m` → `sprinting`
- `sprints-400m` → `sprinting`
- `middle-distance-800m` → `distance_running`
- `long-distance-5000m` → `distance_running`
- `high-jump` → `high_jump`
- `pole-vault` → `pole_vault`
- `long-jump` → `horizontal_jumps`
- `triple-jump` → `horizontal_jumps`
- `shot-put` → `throws`
- `discus` → `throws`

### Other Sports:
- `basketball` → `basketball`
- `swimming` → `swimming`
- `soccer` → `soccer`
- `tennis` → `tennis`
- `weightlifting` → `weightlifting`
- `yoga` → `yoga`
- `golf` → `golf`

## Adding New Sports

1. Add a new column to your Excel file with the sport name
2. Use underscores for spaces (e.g., `martial_arts`)
3. Fill in personalized content for each step
4. Re-run the parser to update the JSON

## Example Personalization

Original:
> "Start by mentally immersing yourself in the environment where you'll perform. Imagine every detail - whether it's the track, gym, field, court, or road."

Personalized for Swimming:
> "Start by mentally immersing yourself in the environment where you'll perform. Imagine every detail - the pool."

Personalized for Basketball:
> "Start by mentally immersing yourself in the environment where you'll perform. Imagine every detail - the court."

## Benefits

- **Zero API costs**: No OpenAI API calls needed
- **Instant responses**: No network latency
- **Quality control**: You write and review all content
- **Easy updates**: Just edit Excel and re-parse
- **Gradual expansion**: Add sports as needed

## Troubleshooting

1. **Personalization not working?**
   - Check that JSON file exists: `data/personalization/parsed/personalization-data.json`
   - Verify visualization ID matches Excel filename
   - Ensure sport name mapping is correct

2. **Changes not showing?**
   - Re-run the parser after Excel edits
   - Restart the app to reload JSON data

3. **Sport not supported?**
   - Add a new column to Excel file
   - Fill in content and re-parse