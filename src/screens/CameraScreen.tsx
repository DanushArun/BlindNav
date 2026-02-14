/**
 * Camera Screen
 * Full-screen camera with AI analysis and voice feedback
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  AccessibilityInfo,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useAppStore } from '../store/useAppStore';
import { UI_CONFIG, AI_CONFIG, A11Y_LABELS } from '../constants';
import speechService from '../services/speech/speechService';
import hapticsService from '../services/haptics/hapticsService';
import { analyzeImage, describePhoto } from '../services/ai/gemini';
import { SceneDescription, Photo } from '../types';

interface CameraScreenProps {
  onExit: () => void;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({ onExit }) => {
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const {
    setCameraActive,
    setProcessing,
    setLastScene,
    addPhoto,
    verbosity,
  } = useAppStore();
  
  // Request permissions on mount
  useEffect(() => {
    const setupPermissions = async () => {
      if (!cameraPermission?.granted) {
        speechService.speak('Requesting camera permission. Please tap allow.', 'high');
        await requestCameraPermission();
      }
      if (!mediaPermission?.granted) {
        await requestMediaPermission();
      }
    };
    
    setupPermissions();
  }, []);
  
  // Start camera and analysis loop
  useEffect(() => {
    if (!cameraPermission?.granted) return;
    
    const startCamera = async () => {
      setCameraActive(true);
      
      // Announce camera start
      await hapticsService.cameraStart();
      speechService.speak('Camera on. Listening to your world.', 'high');
      AccessibilityInfo.announceForAccessibility(A11Y_LABELS.cameraActive);
      
      // Start periodic analysis
      startAnalysisLoop();
    };
    
    startCamera();
    
    return () => {
      stopAnalysisLoop();
      setCameraActive(false);
      speechService.speak('Camera off.', 'normal');
      hapticsService.cameraStop();
    };
  }, [cameraPermission?.granted]);
  
  /**
   * Start the periodic frame analysis loop
   */
  const startAnalysisLoop = useCallback(() => {
    // Analyze frames based on rate limit (every 3 seconds to stay within free tier)
    const intervalMs = Math.max(3000, 60000 / AI_CONFIG.GEMINI_RPM);
    
    analysisIntervalRef.current = setInterval(async () => {
      if (!cameraRef.current || isAnalyzing) return;
      
      await analyzeCurrentFrame();
    }, intervalMs);
  }, [isAnalyzing]);
  
  /**
   * Stop the analysis loop
   */
  const stopAnalysisLoop = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
  }, []);
  
  /**
   * Analyze the current camera frame
   */
  const analyzeCurrentFrame = async () => {
    if (!cameraRef.current || isAnalyzing) return;
    
    try {
      setIsAnalyzing(true);
      setProcessing(true);
      
      // Capture a frame for analysis
      const photo = await cameraRef.current.takePictureAsync({
        quality: AI_CONFIG.IMAGE_QUALITY,
        base64: true,
        skipProcessing: true,
      });
      
      if (!photo?.base64) {
        console.warn('Failed to capture frame');
        return;
      }
      
      // Send to Gemini for analysis
      const scene = await analyzeImage(photo.base64);
      
      if (scene) {
        setLastScene(scene);
        announceScene(scene);
      }
    } catch (error) {
      console.error('Frame analysis error:', error);
    } finally {
      setIsAnalyzing(false);
      setProcessing(false);
    }
  };
  
  /**
   * Announce scene based on verbosity setting
   */
  const announceScene = (scene: SceneDescription) => {
    // Always announce warnings immediately
    if (scene.warnings && scene.warnings.length > 0) {
      scene.warnings.forEach(warning => {
        speechService.speakImmediate(warning);
        hapticsService.obstacleVeryClose();
      });
      return;
    }
    
    // Check for close obstacles
    const closeObjects = scene.objects.filter(
      obj => obj.distance === 'very_close' || obj.distance === 'close'
    );
    
    if (closeObjects.length > 0) {
      const closest = closeObjects[0];
      const distanceText = closest.distance === 'very_close' ? 'very close' : 'close';
      speechService.speakHigh(`${closest.label} ${distanceText}, ${closest.position || 'ahead'}`);
      hapticsService.obstacleWarning(closest.distance!);
      return;
    }
    
    // Verbosity-based announcements
    switch (verbosity) {
      case 'critical':
        // Only announce if there are critical items (handled above)
        break;
        
      case 'balanced':
        // Announce summary
        if (scene.summary) {
          speechService.speakNormal(scene.summary);
        }
        break;
        
      case 'detailed':
        // Announce summary + all objects
        if (scene.summary) {
          speechService.speakNormal(scene.summary);
        }
        
        scene.objects.forEach(obj => {
          const text = `${obj.label}, ${obj.position || 'ahead'}`;
          speechService.speakLow(text);
        });
        
        // Announce visible text
        if (scene.text && scene.text.length > 0) {
          speechService.speakNormal(`Text visible: ${scene.text.join(', ')}`);
        }
        break;
    }
  };
  
  /**
   * Capture a photo (triggered by volume button)
   */
  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    
    try {
      // Haptic feedback immediately
      await hapticsService.photoCapture();
      speechService.speak('Photo captured', 'high');
      
      // Capture high quality photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: true,
      });
      
      if (!photo) return;
      
      // Save to media library
      if (mediaPermission?.granted) {
        await MediaLibrary.saveToLibraryAsync(photo.uri);
      }
      
      // Get AI description
      const description = photo.base64 
        ? await describePhoto(photo.base64)
        : 'Photo saved.';
      
      // Create photo record
      const photoRecord: Photo = {
        id: `photo-${Date.now()}`,
        uri: photo.uri,
        description,
        timestamp: Date.now(),
      };
      
      // Add to store
      addPhoto(photoRecord);
      
      // Announce description
      setTimeout(() => {
        speechService.speak(`Description: ${description}`, 'normal');
      }, 1500);
      
    } catch (error) {
      console.error('Photo capture error:', error);
      speechService.speak('Photo capture failed. Try again.', 'high');
    }
  };
  
  /**
   * Handle exit (back to home)
   */
  const handleExit = useCallback(() => {
    stopAnalysisLoop();
    speechService.stop();
    onExit();
  }, [onExit, stopAnalysisLoop]);
  
  // Handle volume button (simplified - would need native module for actual volume button)
  // For now, we'll use a tap-and-hold gesture
  const handleLongPress = useCallback(() => {
    capturePhoto();
  }, []);
  
  // Permission not granted yet
  if (!cameraPermission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera permission required
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestCameraPermission}
          accessible={true}
          accessibilityLabel="Grant camera permission"
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
      
      {/* Invisible touch area for photo capture (long press) */}
      <TouchableOpacity
        style={styles.captureArea}
        onLongPress={handleLongPress}
        delayLongPress={500}
        accessible={true}
        accessibilityLabel="Press and hold to capture photo"
        accessibilityHint="Long press anywhere to take a photo"
      />
      
      {/* Exit button (bottom left) - for testing, normally would use gesture */}
      <TouchableOpacity
        style={styles.exitButton}
        onPress={handleExit}
        accessible={true}
        accessibilityLabel="Stop camera and go back"
      >
        <Text style={styles.exitButtonText}>✕</Text>
      </TouchableOpacity>
      
      {/* Processing indicator - visual only */}
      {isAnalyzing && (
        <View style={styles.processingIndicator}>
          <Text style={styles.processingText}>●</Text>
        </View>
      )}
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
  processingIndicator: {
    position: 'absolute',
    top: 50,
    right: 30,
  },
  processingText: {
    color: UI_CONFIG.COLORS.buttonActive,
    fontSize: 20,
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

export default CameraScreen;
