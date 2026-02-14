// Core types for Blind Navigation App

export interface Detection {
  id: string;
  type: string;
  label: string;
  confidence: number;
  distance?: 'very_close' | 'close' | 'medium' | 'far';
  position?: 'left' | 'center' | 'right';
  boundingBox?: BoundingBox;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SceneDescription {
  summary: string;
  objects: Detection[];
  text?: string[];
  warnings?: string[];
  timestamp: number;
}

export interface Photo {
  id: string;
  uri: string;
  description: string;
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface SpeechQueueItem {
  id: string;
  text: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  timestamp: number;
}

export interface HapticPattern {
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  count?: number;
  interval?: number;
}

export interface AppState {
  // Camera state
  isCameraActive: boolean;
  isProcessing: boolean;
  
  // Speech state
  isSpeaking: boolean;
  speechQueue: SpeechQueueItem[];
  
  // Settings
  verbosity: 'critical' | 'balanced' | 'detailed';
  language: 'en' | 'hi';
  speechRate: number;
  
  // Photos
  photos: Photo[];
  
  // Last scene
  lastScene: SceneDescription | null;
}

export type Screen = 'home' | 'camera' | 'gallery' | 'settings';

export interface GeminiResponse {
  scene: string;
  objects: Array<{
    name: string;
    position: string;
    distance: string;
  }>;
  text_visible: string[];
  warnings: string[];
  navigation_hint: string;
}
