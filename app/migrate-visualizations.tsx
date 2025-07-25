import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getFirebaseFirestore } from '@/config/firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { visualizations } from '@/constants/visualizations';
import { CheckCircle, XCircle, Upload } from 'lucide-react-native';

export default function MigrateVisualizationsScreen() {
  const colors = useThemeColors();
  const [isLoading, setIsLoading] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{
    visualizations: boolean | null;
    templates: boolean | null;
    errors: string[];
  }>({
    visualizations: null,
    templates: null,
    errors: [],
  });
  
  const firestore = getFirebaseFirestore();
  
  const migrateVisualizations = async () => {
    setIsLoading(true);
    setMigrationStatus({ visualizations: null, templates: null, errors: [] });
    
    try {
      // Migrate visualizations
      console.log('Starting visualization migration...');
      const batch = writeBatch(firestore);
      let count = 0;
      
      for (const visualization of visualizations) {
        const docRef = doc(firestore, 'visualizations', visualization.id);
        
        const firestoreData = {
          id: visualization.id,
          title: visualization.title,
          description: visualization.description,
          duration: visualization.duration,
          category: visualization.category,
          backgroundAudio: visualization.backgroundAudio || null,
          steps: visualization.steps.map(step => ({
            id: step.id,
            content: step.content,
            duration: step.duration,
          })),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        batch.set(docRef, firestoreData);
        count++;
      }
      
      await batch.commit();
      console.log(`Migrated ${count} visualizations`);
      
      setMigrationStatus(prev => ({ ...prev, visualizations: true }));
      
      // Migrate templates
      console.log('Loading personalization templates...');
      try {
        const templates = require('@/data/personalization/templates/visualization-templates.json');
        const templateBatch = writeBatch(firestore);
        let templateCount = 0;
        
        for (const [visualizationId, steps] of Object.entries(templates)) {
          const docRef = doc(firestore, 'personalization_templates', visualizationId);
          
          templateBatch.set(docRef, {
            visualizationId,
            steps: steps as any[],
            createdAt: new Date(),
          });
          
          templateCount++;
        }
        
        await templateBatch.commit();
        console.log(`Migrated ${templateCount} templates`);
        
        setMigrationStatus(prev => ({ ...prev, templates: true }));
      } catch (error) {
        console.error('Template migration error:', error);
        setMigrationStatus(prev => ({ 
          ...prev, 
          templates: false,
          errors: [...prev.errors, 'Failed to migrate templates: ' + error.message]
        }));
      }
      
      Alert.alert('Success', 'Migration completed successfully!');
    } catch (error: any) {
      console.error('Migration error:', error);
      setMigrationStatus(prev => ({ 
        ...prev, 
        visualizations: false,
        errors: [...prev.errors, 'Failed to migrate visualizations: ' + error.message]
      }));
      Alert.alert('Error', 'Migration failed. Check the logs for details.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const styles = {
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 8,
    },
    description: {
      fontSize: 16,
      color: colors.secondary,
      lineHeight: 24,
    },
    section: {
      marginBottom: 24,
      padding: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 12,
    },
    info: {
      fontSize: 14,
      color: colors.secondary,
      marginBottom: 4,
    },
    button: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      marginBottom: 24,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600' as const,
      marginLeft: 8,
    },
    statusSection: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    statusRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
    },
    statusText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 8,
      flex: 1,
    },
    successIcon: {
      color: colors.success,
    },
    errorIcon: {
      color: colors.error,
    },
    errorText: {
      fontSize: 14,
      color: colors.error,
      marginTop: 4,
    },
    note: {
      backgroundColor: colors.warning + '20',
      padding: 12,
      borderRadius: 8,
      marginTop: 16,
    },
    noteText: {
      fontSize: 14,
      color: colors.text,
      fontStyle: 'italic' as const,
    },
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Migrate Visualizations',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.primary,
        }}
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Migrate to Firestore</Text>
            <Text style={styles.description}>
              This tool uploads all visualizations and templates to Firestore for use with Cloud Functions.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What will be migrated:</Text>
            <Text style={styles.info}>• {visualizations.length} visualizations</Text>
            <Text style={styles.info}>• Personalization templates</Text>
            <Text style={styles.info}>• All metadata and configurations</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={migrateVisualizations}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Upload size={24} color="#FFFFFF" />
            )}
            <Text style={styles.buttonText}>
              {isLoading ? 'Migrating...' : 'Start Migration'}
            </Text>
          </TouchableOpacity>
          
          {(migrationStatus.visualizations !== null || migrationStatus.templates !== null) && (
            <View style={styles.statusSection}>
              <Text style={styles.sectionTitle}>Migration Status</Text>
              
              <View style={styles.statusRow}>
                {migrationStatus.visualizations === true ? (
                  <CheckCircle size={20} style={styles.successIcon} />
                ) : migrationStatus.visualizations === false ? (
                  <XCircle size={20} style={styles.errorIcon} />
                ) : (
                  <View style={{ width: 20 }} />
                )}
                <Text style={styles.statusText}>
                  Visualizations: {
                    migrationStatus.visualizations === true ? 'Success' :
                    migrationStatus.visualizations === false ? 'Failed' : 'Pending'
                  }
                </Text>
              </View>
              
              <View style={styles.statusRow}>
                {migrationStatus.templates === true ? (
                  <CheckCircle size={20} style={styles.successIcon} />
                ) : migrationStatus.templates === false ? (
                  <XCircle size={20} style={styles.errorIcon} />
                ) : (
                  <View style={{ width: 20 }} />
                )}
                <Text style={styles.statusText}>
                  Templates: {
                    migrationStatus.templates === true ? 'Success' :
                    migrationStatus.templates === false ? 'Failed' : 'Pending'
                  }
                </Text>
              </View>
              
              {migrationStatus.errors.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  {migrationStatus.errors.map((error, index) => (
                    <Text key={index} style={styles.errorText}>{error}</Text>
                  ))}
                </View>
              )}
            </View>
          )}
          
          <View style={styles.note}>
            <Text style={styles.noteText}>
              Note: This migration can be run multiple times safely. Existing data will be overwritten.
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}