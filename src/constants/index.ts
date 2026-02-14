// App Constants

export const APP_CONFIG = {
  name: 'BlindNav',
  version: '1.0.0',
} as const;

// AI Processing Configuration
export const AI_CONFIG = {
  // Frame processing rate (frames per second to analyze)
  FRAME_RATE: 2, // Process 2 frames per second for Gemini (rate limit friendly)
  
  // Gemini API rate limits (free tier)
  GEMINI_RPM: 15, // 15 requests per minute
  GEMINI_DAILY_LIMIT: 1500, // 1500 requests per day
  
  // Minimum confidence threshold for detections
  MIN_CONFIDENCE: 0.5,
  
  // Image quality for API (lower = faster, less tokens)
  IMAGE_QUALITY: 0.7,
  IMAGE_MAX_WIDTH: 640,
  IMAGE_MAX_HEIGHT: 480,
} as const;

// Speech Configuration
export const SPEECH_CONFIG = {
  // Speech rates by setting
  RATE: {
    slow: 0.8,
    normal: 1.0,
    fast: 1.3,
  },
  
  // Pitch
  PITCH: 1.0,
  
  // Languages
  LANGUAGES: {
    en: 'en-IN', // English (India)
    hi: 'hi-IN', // Hindi (India)
  },
  
  // Minimum time between non-critical announcements (ms)
  MIN_ANNOUNCEMENT_GAP: 2000,
  
  // Priority timeouts (ms to wait before dropping)
  PRIORITY_TIMEOUT: {
    critical: 0,    // Never drop
    high: 5000,     // 5 seconds
    normal: 10000,  // 10 seconds
    low: 15000,     // 15 seconds
  },
} as const;

// Haptic Patterns
export const HAPTIC_PATTERNS = {
  // Button interactions
  buttonPress: { type: 'medium' as const },
  buttonActivate: { type: 'heavy' as const },
  
  // Confirmations
  photoCapture: { type: 'success' as const, count: 3, interval: 100 },
  cameraStart: { type: 'medium' as const, count: 2, interval: 150 },
  cameraStop: { type: 'light' as const },
  
  // Warnings
  obstacleClose: { type: 'warning' as const, count: 2, interval: 100 },
  obstacleVeryClose: { type: 'error' as const, count: 4, interval: 80 },
  
  // Navigation
  directionLeft: { type: 'light' as const },
  directionRight: { type: 'light' as const },
  pathClear: { type: 'success' as const },
} as const;

// UI Constants
export const UI_CONFIG = {
  // Big button size (percentage of screen)
  BUTTON_SIZE_PERCENT: 70,
  
  // Colors (high contrast for helpers/low vision)
  COLORS: {
    primary: '#007AFF',
    background: '#000000',
    buttonActive: '#34C759',
    buttonInactive: '#007AFF',
    danger: '#FF3B30',
    text: '#FFFFFF',
  },
  
  // Animation durations
  ANIMATION_DURATION: 200,
} as const;

// Accessibility Labels
export const A11Y_LABELS = {
  homeButton: 'Initialize camera. Double tap to start navigation assistance.',
  cameraActive: 'Camera is active. Listening to your surroundings.',
  capturePhoto: 'Photo captured successfully.',
  settingsButton: 'Settings. Double tap to open settings.',
  galleryButton: 'Photo gallery. Double tap to view your photos.',
} as const;

// Gemini Prompt for Scene Analysis
export const GEMINI_PROMPT = `You are an AI assistant helping a blind person navigate. Analyze this image and provide a JSON response.

Be concise but informative. Focus on:
1. Immediate obstacles or hazards (most important)
2. People and their positions
3. Navigation-relevant objects (doors, stairs, crossings)
4. Any visible text (signs, labels)

Respond ONLY with valid JSON in this format:
{
  "scene": "Brief 1-sentence scene description",
  "objects": [
    {"name": "object name", "position": "left/center/right", "distance": "very close/close/medium/far"}
  ],
  "text_visible": ["any visible text"],
  "warnings": ["any safety warnings"],
  "navigation_hint": "Brief navigation suggestion"
}

Keep object list to top 5 most important items. Prioritize hazards and obstacles.`;
