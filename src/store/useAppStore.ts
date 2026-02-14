/**
 * App Store (Zustand)
 * Centralized state management for the Blind Navigation App
 */

import { create } from 'zustand';
import { Photo, SceneDescription, Screen } from '../types';

interface AppState {
  // Navigation
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
  
  // Camera state
  isCameraActive: boolean;
  setCameraActive: (active: boolean) => void;
  isProcessing: boolean;
  setProcessing: (processing: boolean) => void;
  
  // Speech state
  isSpeaking: boolean;
  setSpeaking: (speaking: boolean) => void;
  isPaused: boolean;
  setPaused: (paused: boolean) => void;
  
  // Settings
  verbosity: 'critical' | 'balanced' | 'detailed';
  setVerbosity: (level: 'critical' | 'balanced' | 'detailed') => void;
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  speechRate: 'slow' | 'normal' | 'fast';
  setSpeechRate: (rate: 'slow' | 'normal' | 'fast') => void;
  
  // Scene
  lastScene: SceneDescription | null;
  setLastScene: (scene: SceneDescription | null) => void;
  
  // Photos
  photos: Photo[];
  addPhoto: (photo: Photo) => void;
  removePhoto: (id: string) => void;
  clearPhotos: () => void;
  
  // Error handling
  lastError: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentScreen: 'home',
  setScreen: (screen) => set({ currentScreen: screen }),
  
  // Camera state
  isCameraActive: false,
  setCameraActive: (active) => set({ isCameraActive: active }),
  isProcessing: false,
  setProcessing: (processing) => set({ isProcessing: processing }),
  
  // Speech state
  isSpeaking: false,
  setSpeaking: (speaking) => set({ isSpeaking: speaking }),
  isPaused: false,
  setPaused: (paused) => set({ isPaused: paused }),
  
  // Settings
  verbosity: 'balanced',
  setVerbosity: (level) => set({ verbosity: level }),
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),
  speechRate: 'normal',
  setSpeechRate: (rate) => set({ speechRate: rate }),
  
  // Scene
  lastScene: null,
  setLastScene: (scene) => set({ lastScene: scene }),
  
  // Photos
  photos: [],
  addPhoto: (photo) => set((state) => ({ 
    photos: [photo, ...state.photos].slice(0, 100) // Keep max 100 photos
  })),
  removePhoto: (id) => set((state) => ({
    photos: state.photos.filter(p => p.id !== id)
  })),
  clearPhotos: () => set({ photos: [] }),
  
  // Error handling
  lastError: null,
  setError: (error) => set({ lastError: error }),
  clearError: () => set({ lastError: null }),
}));

// Selector hooks for common use cases
export const useCameraState = () => useAppStore((state) => ({
  isActive: state.isCameraActive,
  isProcessing: state.isProcessing,
}));

export const useSpeechState = () => useAppStore((state) => ({
  isSpeaking: state.isSpeaking,
  isPaused: state.isPaused,
}));

export const useSettings = () => useAppStore((state) => ({
  verbosity: state.verbosity,
  language: state.language,
  speechRate: state.speechRate,
}));

export const usePhotos = () => useAppStore((state) => state.photos);

export const useCurrentScreen = () => useAppStore((state) => state.currentScreen);

export default useAppStore;
