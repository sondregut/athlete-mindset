import { Audio } from 'expo-av';
import { smartLogger } from '@/utils/smart-logger';

export interface AudioStatus {
  isLoading: boolean;
  isPlaying: boolean;
  didJustFinish: boolean;
  error?: string;
}

export type AudioStatusCallback = (status: AudioStatus) => void;

export class AudioManager {
  private static instance: AudioManager;
  private currentSound: Audio.Sound | null = null;
  private isInitialized = false;
  private statusCallbacks: Set<AudioStatusCallback> = new Set();
  private currentStatus: AudioStatus = {
    isLoading: false,
    isPlaying: false,
    didJustFinish: false,
  };

  private constructor() {
    this.initializeAudio();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private async initializeAudio(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
      this.isInitialized = true;
      smartLogger.log('audio-manager-init', 'AudioManager initialized successfully');
    } catch (error) {
      smartLogger.log('audio-manager-init-error', `Failed to initialize AudioManager: ${error}`);
      this.updateStatus({ 
        isLoading: false, 
        isPlaying: false, 
        didJustFinish: false, 
        error: 'Failed to initialize audio' 
      });
    }
  }

  public subscribe(callback: AudioStatusCallback): () => void {
    this.statusCallbacks.add(callback);
    // Immediately call with current status
    callback(this.currentStatus);
    
    // Return unsubscribe function
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  private updateStatus(newStatus: Partial<AudioStatus>): void {
    this.currentStatus = { ...this.currentStatus, ...newStatus };
    this.statusCallbacks.forEach(callback => {
      try {
        callback(this.currentStatus);
      } catch (error) {
        smartLogger.log('audio-manager-callback-error', `Status callback error: ${error}`);
      }
    });
  }

  public async playAudioFromUri(uri: string, options: { volume?: number } = {}): Promise<void> {
    if (!uri || uri === 'undefined' || uri === 'null') {
      smartLogger.log('audio-manager-invalid-uri', `Invalid URI provided: ${uri}`);
      this.updateStatus({ 
        isLoading: false, 
        isPlaying: false, 
        didJustFinish: false, 
        error: 'Invalid audio URI' 
      });
      return;
    }

    smartLogger.log('audio-manager-play', `Playing audio from URI: ${uri.substring(0, 50)}...`);
    
    // Update status to loading
    this.updateStatus({ 
      isLoading: true, 
      isPlaying: false, 
      didJustFinish: false, 
      error: undefined 
    });

    try {
      // CRITICAL: Stop and unload any existing sound FIRST
      await this.stopAndUnloadCurrentSound();

      // Ensure audio is initialized
      await this.initializeAudio();

      // Create new sound
      smartLogger.log('audio-manager-create', 'Creating new Audio.Sound object');
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { 
          shouldPlay: true,
          volume: options.volume || 0.8,
        }
      );

      // Set the new sound as current
      this.currentSound = sound;

      // Set up playback status monitoring
      this.currentSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            smartLogger.log('audio-manager-finished', 'Audio playback finished');
            this.updateStatus({ 
              isLoading: false, 
              isPlaying: false, 
              didJustFinish: true, 
              error: undefined 
            });
          } else if (status.isPlaying) {
            this.updateStatus({ 
              isLoading: false, 
              isPlaying: true, 
              didJustFinish: false, 
              error: undefined 
            });
          }
        }
      });

      // Initial success status
      this.updateStatus({ 
        isLoading: false, 
        isPlaying: true, 
        didJustFinish: false, 
        error: undefined 
      });

      smartLogger.log('audio-manager-success', 'Audio playback started successfully');

    } catch (error) {
      smartLogger.log('audio-manager-error', `Failed to play audio: ${error}`);
      this.updateStatus({ 
        isLoading: false, 
        isPlaying: false, 
        didJustFinish: false, 
        error: error instanceof Error ? error.message : 'Unknown audio error' 
      });
    }
  }

  private async stopAndUnloadCurrentSound(): Promise<void> {
    if (!this.currentSound) return;

    try {
      smartLogger.log('audio-manager-stop', 'Stopping and unloading current sound');
      
      const status = await this.currentSound.getStatusAsync();
      
      if (status.isLoaded) {
        if (status.isPlaying) {
          await this.currentSound.stopAsync();
        }
        await this.currentSound.unloadAsync();
      }
      
      smartLogger.log('audio-manager-stop-success', 'Current sound stopped and unloaded');
    } catch (error) {
      smartLogger.log('audio-manager-stop-error', `Error stopping current sound: ${error}`);
      // Continue anyway - don't let this block new audio
    } finally {
      this.currentSound = null;
    }
  }

  public async pause(): Promise<void> {
    if (!this.currentSound) return;

    try {
      const status = await this.currentSound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await this.currentSound.pauseAsync();
        this.updateStatus({ 
          isLoading: false, 
          isPlaying: false, 
          didJustFinish: false, 
          error: undefined 
        });
        smartLogger.log('audio-manager-pause', 'Audio paused');
      }
    } catch (error) {
      smartLogger.log('audio-manager-pause-error', `Error pausing audio: ${error}`);
    }
  }

  public async resume(): Promise<void> {
    if (!this.currentSound) return;

    try {
      const status = await this.currentSound.getStatusAsync();
      if (status.isLoaded && !status.isPlaying) {
        await this.currentSound.playAsync();
        this.updateStatus({ 
          isLoading: false, 
          isPlaying: true, 
          didJustFinish: false, 
          error: undefined 
        });
        smartLogger.log('audio-manager-resume', 'Audio resumed');
      }
    } catch (error) {
      smartLogger.log('audio-manager-resume-error', `Error resuming audio: ${error}`);
    }
  }

  public async stop(): Promise<void> {
    smartLogger.log('audio-manager-stop-public', 'Public stop method called');
    await this.stopAndUnloadCurrentSound();
    this.updateStatus({ 
      isLoading: false, 
      isPlaying: false, 
      didJustFinish: false, 
      error: undefined 
    });
  }

  public getCurrentStatus(): AudioStatus {
    return { ...this.currentStatus };
  }

  public isCurrentlyPlaying(): boolean {
    return this.currentStatus.isPlaying;
  }

  public isCurrentlyLoading(): boolean {
    return this.currentStatus.isLoading;
  }

  // Cleanup method for app shutdown
  public async cleanup(): Promise<void> {
    smartLogger.log('audio-manager-cleanup', 'Cleaning up AudioManager');
    await this.stopAndUnloadCurrentSound();
    this.statusCallbacks.clear();
  }
}