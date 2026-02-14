/**
 * Speech Service
 * Handles Text-to-Speech with priority queue management
 */

import * as Speech from 'expo-speech';
import { SPEECH_CONFIG } from '../../constants';
import { SpeechQueueItem } from '../../types';

type Priority = 'critical' | 'high' | 'normal' | 'low';
type Language = 'en' | 'hi';

interface SpeechServiceState {
  isSpeaking: boolean;
  queue: SpeechQueueItem[];
  currentLanguage: Language;
  speechRate: number;
  isPaused: boolean;
}

// Service state
const state: SpeechServiceState = {
  isSpeaking: false,
  queue: [],
  currentLanguage: 'en',
  speechRate: SPEECH_CONFIG.RATE.normal,
  isPaused: false,
};

// Track last announcement time for throttling
let lastAnnouncementTime = 0;

/**
 * Generate unique ID for queue items
 */
function generateId(): string {
  return `speech-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get priority value for sorting (higher = more urgent)
 */
function getPriorityValue(priority: Priority): number {
  switch (priority) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'normal': return 2;
    case 'low': return 1;
    default: return 0;
  }
}

/**
 * Add item to queue and sort by priority
 */
function addToQueue(text: string, priority: Priority): void {
  const item: SpeechQueueItem = {
    id: generateId(),
    text,
    priority,
    timestamp: Date.now(),
  };
  
  state.queue.push(item);
  
  // Sort by priority (highest first), then by timestamp (oldest first)
  state.queue.sort((a, b) => {
    const priorityDiff = getPriorityValue(b.priority) - getPriorityValue(a.priority);
    if (priorityDiff !== 0) return priorityDiff;
    return a.timestamp - b.timestamp;
  });
  
  // Remove expired items
  const now = Date.now();
  state.queue = state.queue.filter(item => {
    const timeout = SPEECH_CONFIG.PRIORITY_TIMEOUT[item.priority];
    return now - item.timestamp < timeout;
  });
}

/**
 * Process the next item in the queue
 */
async function processQueue(): Promise<void> {
  if (state.isPaused || state.isSpeaking || state.queue.length === 0) {
    return;
  }
  
  const item = state.queue.shift();
  if (!item) return;
  
  // Check if item has expired
  const now = Date.now();
  const timeout = SPEECH_CONFIG.PRIORITY_TIMEOUT[item.priority];
  if (now - item.timestamp > timeout && item.priority !== 'critical') {
    // Skip expired item, process next
    processQueue();
    return;
  }
  
  await speakItem(item);
}

/**
 * Speak a single item
 */
async function speakItem(item: SpeechQueueItem): Promise<void> {
  return new Promise((resolve) => {
    state.isSpeaking = true;
    
    const languageCode = SPEECH_CONFIG.LANGUAGES[state.currentLanguage];
    
    Speech.speak(item.text, {
      language: languageCode,
      rate: state.speechRate,
      pitch: SPEECH_CONFIG.PITCH,
      onStart: () => {
        console.log('Speaking:', item.text.substring(0, 50));
      },
      onDone: () => {
        state.isSpeaking = false;
        lastAnnouncementTime = Date.now();
        resolve();
        // Process next item after short delay
        setTimeout(() => processQueue(), 300);
      },
      onError: (error) => {
        console.error('Speech error:', error);
        state.isSpeaking = false;
        resolve();
        setTimeout(() => processQueue(), 300);
      },
      onStopped: () => {
        state.isSpeaking = false;
        resolve();
      },
    });
  });
}

/**
 * Speak immediately (for critical alerts) - interrupts current speech
 */
export function speakImmediate(text: string): void {
  // Stop any current speech
  Speech.stop();
  state.isSpeaking = false;
  
  // Clear non-critical items from queue
  state.queue = state.queue.filter(item => item.priority === 'critical');
  
  // Add critical item at front
  const item: SpeechQueueItem = {
    id: generateId(),
    text,
    priority: 'critical',
    timestamp: Date.now(),
  };
  state.queue.unshift(item);
  
  // Process immediately
  processQueue();
}

/**
 * Queue high-priority speech
 */
export function speakHigh(text: string): void {
  addToQueue(text, 'high');
  processQueue();
}

/**
 * Queue normal-priority speech
 */
export function speakNormal(text: string): void {
  // Throttle normal announcements
  const now = Date.now();
  if (now - lastAnnouncementTime < SPEECH_CONFIG.MIN_ANNOUNCEMENT_GAP) {
    return;
  }
  
  addToQueue(text, 'normal');
  processQueue();
}

/**
 * Queue low-priority (background) speech
 */
export function speakLow(text: string): void {
  addToQueue(text, 'low');
  processQueue();
}

/**
 * Simple speak function with auto priority detection
 */
export function speak(text: string, priority: Priority = 'normal'): void {
  switch (priority) {
    case 'critical':
      speakImmediate(text);
      break;
    case 'high':
      speakHigh(text);
      break;
    case 'low':
      speakLow(text);
      break;
    default:
      speakNormal(text);
  }
}

/**
 * Pause speech (for user interrupt)
 */
export function pause(): void {
  state.isPaused = true;
  Speech.stop();
  state.isSpeaking = false;
}

/**
 * Resume speech
 */
export function resume(): void {
  state.isPaused = false;
  processQueue();
}

/**
 * Stop all speech and clear queue
 */
export function stop(): void {
  Speech.stop();
  state.queue = [];
  state.isSpeaking = false;
  state.isPaused = false;
}

/**
 * Set language
 */
export function setLanguage(language: Language): void {
  state.currentLanguage = language;
}

/**
 * Set speech rate
 */
export function setSpeechRate(rate: 'slow' | 'normal' | 'fast'): void {
  state.speechRate = SPEECH_CONFIG.RATE[rate];
}

/**
 * Check if currently speaking
 */
export function isSpeaking(): boolean {
  return state.isSpeaking;
}

/**
 * Get queue length
 */
export function getQueueLength(): number {
  return state.queue.length;
}

/**
 * Check if available voices support the language
 */
export async function getAvailableVoices(): Promise<Speech.Voice[]> {
  try {
    return await Speech.getAvailableVoicesAsync();
  } catch (error) {
    console.error('Failed to get voices:', error);
    return [];
  }
}

export default {
  speak,
  speakImmediate,
  speakHigh,
  speakNormal,
  speakLow,
  pause,
  resume,
  stop,
  setLanguage,
  setSpeechRate,
  isSpeaking,
  getQueueLength,
  getAvailableVoices,
};
