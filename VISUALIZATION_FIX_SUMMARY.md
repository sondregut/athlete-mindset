# Visualization Player Script Display Fix

## Problem
The visualization player was not showing any script content on screen. Investigation revealed:
1. Visualizations in `constants/visualizations.ts` had empty `steps` arrays
2. The actual content was in Excel templates extracted to `visualization-templates.json`
3. When personalization was disabled, there was no fallback content to display

## Solution Implemented

### 1. Created Template Loader (`utils/load-visualization-templates.ts`)
- Loads templates from `data/personalization/templates/visualization-templates.json`
- Provides `getVisualizationWithTemplates()` function to populate empty steps
- Estimates duration based on word count (150 words/minute)

### 2. Updated Visualization Getters
- Modified `getVisualizationById()` to automatically load templates
- Updated `getAllVisualizations()` and `getVisualizationsByCategory()` similarly
- Now all visualizations have populated steps when accessed

### 3. Fixed Personalization Hook
- When personalization is disabled, explicitly set `personalizedSteps` to `null`
- This ensures the player falls back to the original (now populated) steps
- Fixed baseContent mapping to handle empty steps arrays

## How It Works Now

1. **With Personalization Enabled:**
   - Hook generates sport-specific content using Excel templates
   - Personalized steps are displayed in the player
   - TTS generates audio for personalized content using Gemini

2. **With Personalization Disabled:**
   - Hook returns `null` for personalizedSteps
   - Player uses original steps from visualization
   - Original steps are now populated from templates
   - TTS generates audio for template content

## Testing
- Created `scripts/test-template-loading.js` to verify templates load correctly
- Confirmed 16 visualizations have templates with proper step content
- Each visualization has between 5-10 steps of guided content

## Result
The visualization player now correctly displays script content whether personalization is enabled or disabled. The scripts are synchronized with the TTS audio generation, providing a complete guided visualization experience.