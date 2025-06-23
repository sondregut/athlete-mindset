import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors } from '@/constants/colors';

interface DataPoint {
  x: number;
  y: number;
  label?: string;
}

interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  showDots?: boolean;
  showGrid?: boolean;
  yAxisLabel?: string;
  xAxisLabel?: string;
  formatYValue?: (value: number) => string;
  formatXValue?: (value: number) => string;
}

const screenWidth = Dimensions.get('window').width;

export default function LineChart({
  data,
  width = screenWidth - 32,
  height = 200,
  strokeColor = colors.primary,
  strokeWidth = 2,
  showDots = true,
  showGrid = true,
  yAxisLabel,
  xAxisLabel,
  formatYValue = (value) => value.toString(),
  formatXValue = (value) => value.toString(),
}: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  // Calculate chart dimensions
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Find min and max values
  const xValues = data.map(d => d.x);
  const yValues = data.map(d => d.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  // Add padding to Y range
  const yRange = maxY - minY || 1;
  const yMin = minY - yRange * 0.1;
  const yMax = maxY + yRange * 0.1;

  // Scale functions
  const scaleX = (x: number) => ((x - minX) / (maxX - minX || 1)) * chartWidth;
  const scaleY = (y: number) => chartHeight - ((y - yMin) / (yMax - yMin || 1)) * chartHeight;

  // Generate grid lines using React Native Views
  const gridLines = [];
  if (showGrid) {
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (chartHeight / 4) * i;
      gridLines.push(
        <View
          key={`h-${i}`}
          style={[
            styles.gridLine,
            {
              position: 'absolute',
              left: 0,
              top: y,
              width: chartWidth,
              height: 1,
              backgroundColor: colors.lightGray,
              opacity: 0.5,
            }
          ]}
        />
      );
    }
  }

  // Y-axis labels
  const yAxisLabels = [];
  for (let i = 0; i <= 4; i++) {
    const value = yMin + ((yMax - yMin) / 4) * (4 - i);
    const y = (chartHeight / 4) * i;
    yAxisLabels.push(
      <Text
        key={`y-${i}`}
        style={[styles.axisLabel, { 
          position: 'absolute',
          left: 0,
          top: y + padding - 8,
        }]}
      >
        {formatYValue(value)}
      </Text>
    );
  }

  // X-axis labels
  const xAxisLabels = [];
  const xLabelStep = Math.max(1, Math.floor(data.length / 4));
  for (let i = 0; i < data.length; i += xLabelStep) {
    const x = scaleX(data[i].x);
    xAxisLabels.push(
      <Text
        key={`x-${i}`}
        style={[styles.axisLabel, {
          position: 'absolute',
          left: x + padding - 10,
          top: height - 30,
          textAlign: 'center',
          width: 20,
        }]}
      >
        {formatXValue(data[i].x)}
      </Text>
    );
  }

  // Create simplified line visualization using dots and connecting lines
  const linePoints = data.map((point, index) => {
    const x = scaleX(point.x);
    const y = scaleY(point.y);
    return { x, y, originalValue: point.y };
  });

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Chart area */}
      <View style={[styles.chartArea, { 
        left: padding, 
        top: padding, 
        width: chartWidth, 
        height: chartHeight 
      }]}>
        {/* Grid */}
        {gridLines}
        
        {/* Line segments and dots */}
        {linePoints.map((point, index) => (
          <View key={index}>
            {/* Line segment to next point */}
            {index < linePoints.length - 1 && (
              <View
                style={[
                  styles.lineSegment,
                  {
                    position: 'absolute',
                    left: point.x,
                    top: point.y,
                    width: Math.sqrt(
                      Math.pow(linePoints[index + 1].x - point.x, 2) +
                      Math.pow(linePoints[index + 1].y - point.y, 2)
                    ),
                    height: strokeWidth,
                    backgroundColor: strokeColor,
                    transformOrigin: '0 50%',
                    transform: [
                      {
                        rotate: `${Math.atan2(
                          linePoints[index + 1].y - point.y,
                          linePoints[index + 1].x - point.x
                        )}rad`,
                      },
                    ],
                  }
                ]}
              />
            )}
            
            {/* Data point dot */}
            {showDots && (
              <View
                style={[
                  styles.dot,
                  {
                    position: 'absolute',
                    left: point.x - 4,
                    top: point.y - 4,
                    backgroundColor: strokeColor,
                    borderColor: colors.background,
                  }
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Axis labels */}
      {yAxisLabels}
      {xAxisLabels}

      {/* Axis titles */}
      {yAxisLabel && (
        <Text style={[styles.axisTitle, styles.yAxisTitle]}>
          {yAxisLabel}
        </Text>
      )}
      {xAxisLabel && (
        <Text style={[styles.axisTitle, styles.xAxisTitle, { top: height - 15 }]}>
          {xAxisLabel}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: colors.background,
  },
  chartArea: {
    position: 'absolute',
  },
  noDataText: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
    marginTop: 80,
  },
  axisLabel: {
    fontSize: 10,
    color: colors.darkGray,
  },
  axisTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    position: 'absolute',
  },
  yAxisTitle: {
    left: 5,
    top: 20,
    transform: [{ rotate: '-90deg' }],
  },
  xAxisTitle: {
    left: '50%',
    textAlign: 'center',
  },
  gridLine: {
    // Base style for grid lines
  },
  lineSegment: {
    // Base style for line segments
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
});