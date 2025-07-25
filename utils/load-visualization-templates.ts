import { Visualization, VisualizationStep } from '@/types/visualization';

// Load templates from the pre-extracted JSON file
let cachedTemplates: Record<string, Array<{ stepNumber: number; template: string }>> | null = null;

export function loadVisualizationTemplates(): Record<string, Array<{ stepNumber: number; template: string }>> {
  if (cachedTemplates) {
    return cachedTemplates;
  }

  try {
    // Load pre-extracted templates from JSON
    cachedTemplates = require('@/data/personalization/templates/visualization-templates.json');
    console.log('[loadVisualizationTemplates] Loaded templates for', Object.keys(cachedTemplates || {}).length, 'visualizations');
    return cachedTemplates || {};
  } catch (error) {
    console.error('[loadVisualizationTemplates] Error loading templates:', error);
    // Return empty object as fallback
    cachedTemplates = {};
    return cachedTemplates;
  }
}

export function getVisualizationWithTemplates(visualization: Visualization): Visualization {
  // If steps are already populated, return as-is
  if (visualization.steps && visualization.steps.length > 0) {
    return visualization;
  }

  // Load templates
  const templates = loadVisualizationTemplates();
  const visualizationTemplates = templates[visualization.id];

  if (!visualizationTemplates || visualizationTemplates.length === 0) {
    console.warn(`[getVisualizationWithTemplates] No templates found for visualization: ${visualization.id}`);
    return visualization;
  }

  // Convert templates to visualization steps
  const steps: VisualizationStep[] = visualizationTemplates.map((template) => ({
    id: template.stepNumber,
    content: template.template,
    duration: estimateDuration(template.template),
  }));

  // Return visualization with populated steps
  return {
    ...visualization,
    steps,
  };
}

function estimateDuration(content: string): number {
  // Estimate ~150 words per minute for guided visualization
  const words = content.split(/\s+/).length;
  const minutes = words / 150;
  return Math.round(minutes * 60); // Convert to seconds
}