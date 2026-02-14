/**
 * Home Screen
 * Single big button interface for blind users
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { UI_CONFIG, A11Y_LABELS } from '../constants';
import speechService from '../services/speech/speechService';
import hapticsService from '../services/haptics/hapticsService';

const { width, height } = Dimensions.get('window');
const BUTTON_SIZE = Math.min(width, height) * (UI_CONFIG.BUTTON_SIZE_PERCENT / 100);

interface HomeScreenProps {
  onStart: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStart }) => {
  const setScreen = useAppStore((state) => state.setScreen);
  
  // Announce screen on mount
  useEffect(() => {
    const announceScreen = async () => {
      // Small delay to ensure screen is fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      speechService.speak('Ready. Tap anywhere to start navigation.', 'normal');
      
      // Also announce for screen readers
      AccessibilityInfo.announceForAccessibility('Ready. Tap anywhere to start navigation.');
    };
    
    announceScreen();
    
    return () => {
      speechService.stop();
    };
  }, []);
  
  const handlePress = useCallback(async () => {
    // Haptic feedback
    await hapticsService.buttonActivate();
    
    // Voice confirmation
    speechService.speak('Starting camera', 'high');
    
    // Small delay for feedback to complete
    setTimeout(() => {
      setScreen('camera');
      onStart();
    }, 300);
  }, [setScreen, onStart]);
  
  const handlePressIn = useCallback(async () => {
    await hapticsService.buttonPress();
  }, []);
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.bigButton}
        onPress={handlePress}
        onPressIn={handlePressIn}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={A11Y_LABELS.homeButton}
        accessibilityRole="button"
        accessibilityHint="Activates the camera and starts AI navigation assistance"
      >
        {/* 
          Button is intentionally empty - blind users don't need visual text.
          The blue color provides a target for sighted helpers if present.
        */}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    backgroundColor: UI_CONFIG.COLORS.buttonInactive,
    borderRadius: BUTTON_SIZE / 10,
    borderWidth: 4,
    borderColor: UI_CONFIG.COLORS.text,
    // Shadow for visual depth (for sighted helpers)
    shadowColor: UI_CONFIG.COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default HomeScreen;
