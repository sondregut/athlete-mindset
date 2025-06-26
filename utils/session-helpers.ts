/**
 * Helper functions for formatting session data
 */

/**
 * Format duration from seconds to human-readable format
 */
export const formatDuration = (seconds?: number): string => {
  if (!seconds || seconds === 0) return '';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
};

/**
 * Get color based on RPE value (1-10)
 */
export const getRPEColor = (rpe?: number): string => {
  if (!rpe) return '#9A9A9A'; // gray for no data
  
  if (rpe <= 3) return '#4CAF50'; // green - easy
  if (rpe <= 6) return '#FFC107'; // yellow - moderate
  if (rpe <= 8) return '#FF9800'; // orange - hard
  return '#F44336'; // red - very hard
};

/**
 * Get color based on readiness rating (1-10)
 */
export const getReadinessColor = (readiness?: number): string => {
  if (!readiness) return '#9A9A9A'; // gray for no data
  
  if (readiness >= 8) return '#4CAF50'; // green - great
  if (readiness >= 6) return '#FFC107'; // yellow - okay
  if (readiness >= 4) return '#FF9800'; // orange - low
  return '#F44336'; // red - very low
};

/**
 * Truncate text to a certain length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};