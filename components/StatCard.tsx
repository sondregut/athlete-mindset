import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import Card from './Card';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  unit?: string;
  flex?: number;
}

export default function StatCard({ title, value, icon, unit, flex }: StatCardProps) {
  const colors = useThemeColors();
  
  const styles = StyleSheet.create({
    card: {
      flex: flex || 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      margin: 6,
    },
    iconContainer: {
      marginBottom: 8,
    },
    value: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    title: {
      fontSize: 14,
      color: colors.darkGray,
      textAlign: 'center',
    },
    unit: {
      fontSize: 14,
      color: colors.darkGray,
      marginLeft: 4,
    },
    valueContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
    }
  });
  
  return (
    <Card style={styles.card}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      {unit ? (
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.unit}>{unit}</Text>
        </View>
      ) : (
        <Text style={styles.value}>{value}</Text>
      )}
      <Text style={styles.title}>{title}</Text>
    </Card>
  );
}