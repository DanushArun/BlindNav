/**
 * Blind Navigation App
 * 
 * AI-powered navigation assistant for blind users
 * Uses Gemini Vision API for real-time scene understanding
 * 
 * MVP Features:
 * - Single big button to start camera
 * - Real-time AI narration of surroundings
 * - Long press to capture photos
 * - Haptic feedback for all interactions
 */

import React, { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, View, AccessibilityInfo } from 'react-native';
import { useAppStore, useCurrentScreen } from './src/store/useAppStore';
import { HomeScreen } from './src/screens/HomeScreen';
import { CameraScreen } from './src/screens/CameraScreen';
import { UI_CONFIG } from './src/constants';
import speechService from './src/services/speech/speechService';

export default function App() {
  const currentScreen = useCurrentScreen();
  const setScreen = useAppStore((state) => state.setScreen);
  const language = useAppStore((state) => state.language);
  const speechRate = useAppStore((state) => state.speechRate);
  
  // Initialize app
  useEffect(() => {
    const init = async () => {
      // Set up speech service with user preferences
      speechService.setLanguage(language);
      speechService.setSpeechRate(speechRate);
      
      // Enable screen reader announcements
      AccessibilityInfo.announceForAccessibility('Blind Navigation App loaded.');
      
      console.log('App initialized');
      console.log('Gemini API Key configured:', !!process.env.EXPO_PUBLIC_GEMINI_API_KEY);
    };
    
    init();
    
    // Cleanup on unmount
    return () => {
      speechService.stop();
    };
  }, []);
  
  // Handle navigation to camera
  const handleStartCamera = useCallback(() => {
    setScreen('camera');
  }, [setScreen]);
  
  // Handle exit from camera
  const handleExitCamera = useCallback(() => {
    setScreen('home');
  }, [setScreen]);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {currentScreen === 'home' && (
        <HomeScreen onStart={handleStartCamera} />
      )}
      
      {currentScreen === 'camera' && (
        <CameraScreen onExit={handleExitCamera} />
      )}
      
      {/* Gallery and Settings screens to be added post-MVP */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.background,
  },
});
