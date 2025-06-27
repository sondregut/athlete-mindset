import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import Card from './Card';

interface SmallStatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
}

export default function SmallStatCard({ title, value, icon }: SmallStatCardProps) {
  const colors = useThemeColors();
  
  const styles = StyleSheet.create({
    card: {
      padding: 12,
      height: 80,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '100%',
    },
    leftContent: {
      flex: 1,
    },
    title: {
      fontSize: 12,
      color: colors.darkGray,
      marginBottom: 4,
    },
    value: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    iconContainer: {
      marginLeft: 8,
    },
  });
  
  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        <View style={styles.leftContent}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
        <View style={styles.iconContainer}>
          {icon}
        </View>
      </View>
    </Card>
  );
}