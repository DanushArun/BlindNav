/**
 * Camera Screen - Live Streaming Version
 * Continuous camera streaming with Gemini Live
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useAppStore } from '../store/useAppStore';
import { UI_CONFIG, A11Y_LABELS } from '../constants';
import speechService from '../services/speech/speechService';
import hapticsService from '../services/haptics/hapticsService';
import { GeminiLiveSession, BLIND_NAVIGATION_PROMPT } from '../services/ai/geminiLive';

interface CameraScreenProps {
  onExit: () => void;
}

export const CameraScreenLive: React.FC<CameraScreenProps> = ({ onExit }) => {
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const geminiSessionRef = useRef<GeminiLiveSession | null>(null);
  
  const {
    setCameraActive,
    setProcessing,
    addPhoto,
  } = useAppStore();
  
  // Initialize Gemini Live session
  useEffect(() => {
    if (!cameraPermission?.granted) return;
    
    const startLiveSession = async () => {
      setCameraActive(true);
      
      // Haptic feedback
      await hapticsService.cameraStart();
      
      // Create Gemini Live session
      geminiSessionRef.current = new GeminiLiveSession({
        onText: (text) => {
          console.log('Gemini:', text);
          
          // Determine priority based on content
          const isUrgent = text.toLowerCase().includes('stop') || 
                          text.toLowerCase().includes('danger') ||
                          text.toLowerCase().includes('warning') ||
                          text.toLowerCase().includes('vehicle') ||
                          text.toLowerCase().includes('stairs');
          
          const priority = isUrgent ? 'critical' : 'high';
          speechService.speak(text, priority);
          
          // Haptic for urgent alerts
          if (isUrgent) {
            hapticsService.obstacleVeryClose();
          }
        },
        onAudioChunk: (audio) => {
          // Future: play audio directly from Gemini
          console.log('Audio chunk received:', audio.length);
        },
        onError: (error) => {
          console.error('Gemini Live error:', error);
          speechService.speak('AI connection error', 'high');
        },
      });
      
      // Start the session
      await geminiSessionRef.current.start(BLIND_NAVIGATION_PROMPT);
      
      // Voice announcement
      speechService.speak('Camera on. Streaming live.', 'high');
      
      // Start streaming frames
      startFrameStreaming();
    };
    
    startLiveSession();
    
    return () => {
      stopFrameStreaming();
      if (geminiSessionRef.current) {
        geminiSessionRef.current.stop();
      }
      setCameraActive(false);
      speechService.speak('Camera off.', 'normal');
      hapticsService.cameraStop();
    };
  }, [cameraPermission?.granted]);
  
  /**
   * Start continuous frame streaming
   * Stream at 1 FPS to stay within API limits
   */
  const startFrameStreaming = () => {
    const STREAM_FPS = 1; // 1 frame per second for continuous narration
    const intervalMs = 1000 / STREAM_FPS;
    
    streamIntervalRef.current = setInterval(async () => {
      if (!cameraRef.current || !geminiSessionRef.current?.isActive()) {
        return;
      }
      
      try {
        setProcessing(true);
        
        // Capture frame
        const frame = await cameraRef.current.takePictureAsync({
          quality: 0.6,
          base64: true,
          skipProcessing: true,
        });
        
        if (frame?.base64) {
          // Stream to Gemini Live
          await geminiSessionRef.current.streamFrame(frame.base64);
        }
      } catch (error) {
        console.error('Frame capture error:', error);
      } finally {
        setProcessing(false);
      }
    }, intervalMs);
  };
  
  const stopFrameStreaming = () => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
  };
  
  /**
   * Capture photo (long press)
   */
  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    
    try {
      await hapticsService.photoCapture();
      speechService.speak('Photo captured', 'high');
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: true,
      });
      
      if (!photo) return;
      
      // Save to library
      if (mediaPermission?.granted) {
        await MediaLibrary.saveToLibraryAsync(photo.uri);
      }
      
      // Ask Gemini to describe
      if (geminiSessionRef.current && photo.base64) {
        await geminiSessionRef.current.sendText('Describe this photo in detail for me to remember later.');
      }
      
      // Add to store
      const photoRecord = {
        id: `photo-${Date.now()}`,
        uri: photo.uri,
        description: 'Photo captured',
        timestamp: Date.now(),
      };
      
      addPhoto(photoRecord);
    } catch (error) {
      console.error('Photo capture error:', error);
      speechService.speak('Photo failed', 'high');
    }
  };
  
  /**
   * Handle exit
   */
  const handleExit = () => {
    stopFrameStreaming();
    if (geminiSessionRef.current) {
      geminiSessionRef.current.stop();
    }
    speechService.stop();
    onExit();
  };
  
  // Permission check
  if (!cameraPermission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestCameraPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        accessible={true}
        accessibilityLabel={A11Y_LABELS.cameraActive}
      />
      
      {/* Full screen touch area for photo capture */}
      <TouchableOpacity
        style={styles.captureArea}
        onLongPress={capturePhoto}
        delayLongPress={800}
        accessible={true}
        accessibilityLabel="Long press to capture photo"
      />
      
      {/* Exit button */}
      <TouchableOpacity
        style={styles.exitButton}
        onPress={handleExit}
        accessible={true}
        accessibilityLabel="Stop camera"
      >
        <Text style={styles.exitButtonText}>✕</Text>
      </TouchableOpacity>
      
      {/* Live indicator */}
      <View style={styles.liveIndicator}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.background,
  },
  captureArea: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  exitButton: {
    position: 'absolute',
    bottom: 50,
    left: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: UI_CONFIG.COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  exitButtonText: {
    color: UI_CONFIG.COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  liveIndicator: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  permissionText: {
    color: UI_CONFIG.COLORS.text,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: UI_CONFIG.COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: UI_CONFIG.COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CameraScreenLive;
