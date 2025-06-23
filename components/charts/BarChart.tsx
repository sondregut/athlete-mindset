import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors } from '@/constants/colors';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarData[];
  width?: number;
  height?: number;
  showValues?: boolean;
  maxValue?: number;
  formatValue?: (value: number) => string;
  horizontal?: boolean;
}

const screenWidth = Dimensions.get('window').width;

export default function BarChart({
  data,
  width = screenWidth - 32,
  height = 200,
  showValues = true,
  maxValue,
  formatValue = (value) => value.toString(),
  horizontal = false,
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2 - 40; // Extra space for labels

  const max = maxValue || Math.max(...data.map(d => d.value));
  const barSpacing = 8;
  const barWidth = horizontal 
    ? (chartHeight - (data.length - 1) * barSpacing) / data.length
    : (chartWidth - (data.length - 1) * barSpacing) / data.length;

  return (
    <View style={[styles.container, { width, height }]}>
      <View style={[styles.chartArea, { 
        left: padding, 
        top: padding, 
        width: chartWidth, 
        height: chartHeight + 40 
      }]}>
        {horizontal ? (
          // Horizontal bars
          <View style={styles.horizontalContainer}>
            {data.map((item, index) => {
              const barLength = max > 0 ? (item.value / max) * (chartWidth - 60) : 0;
              const barColor = item.color || colors.primary;
              
              return (
                <View key={index} style={[styles.horizontalBarContainer, { height: barWidth }]}>
                  <Text style={[styles.horizontalLabel, { width: 50 }]} numberOfLines={1}>
                    {item.label}
                  </Text>
                  <View style={[styles.horizontalBar, { width: barLength, backgroundColor: barColor }]}>
                    {showValues && (
                      <Text style={[styles.barValue, styles.horizontalBarValue]}>
                        {formatValue(item.value)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          // Vertical bars
          <View style={styles.verticalContainer}>
            <View style={[styles.barsContainer, { height: chartHeight }]}>
              {data.map((item, index) => {
                const barHeight = max > 0 ? (item.value / max) * chartHeight : 0;
                const barColor = item.color || colors.primary;
                
                return (
                  <View
                    key={index}
                    style={[
                      styles.barContainer,
                      {
                        width: barWidth,
                        marginRight: index < data.length - 1 ? barSpacing : 0,
                      }
                    ]}
                  >
                    <View style={styles.barWrapper}>
                      {showValues && item.value > 0 && (
                        <Text style={[styles.barValue, { marginBottom: 4 }]}>
                          {formatValue(item.value)}
                        </Text>
                      )}
                      <View
                        style={[
                          styles.bar,
                          {
                            height: barHeight,
                            backgroundColor: barColor,
                            width: '100%',
                          }
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
            
            {/* Labels */}
            <View style={styles.labelsContainer}>
              {data.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.labelContainer,
                    {
                      width: barWidth,
                      marginRight: index < data.length - 1 ? barSpacing : 0,
                    }
                  ]}
                >
                  <Text style={styles.label} numberOfLines={2}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  horizontalContainer: {
    flex: 1,
    justifyContent: 'space-around',
  },
  horizontalBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  horizontalLabel: {
    fontSize: 12,
    color: colors.text,
    marginRight: 8,
    textAlign: 'right',
  },
  horizontalBar: {
    height: '80%',
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 20,
  },
  horizontalBarValue: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '600',
  },
  verticalContainer: {
    flex: 1,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barContainer: {
    alignItems: 'center',
  },
  barWrapper: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 4,
    minHeight: 2,
  },
  barValue: {
    fontSize: 10,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    height: 32,
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 12,
  },
});