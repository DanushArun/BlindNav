/**
 * Haptics Service
 * Handles haptic feedback patterns for blind user interaction
 */

import * as Haptics from 'expo-haptics';
import { HAPTIC_PATTERNS } from '../../constants';

type ImpactStyle = 'light' | 'medium' | 'heavy';
type NotificationType = 'success' | 'warning' | 'error';

interface HapticPattern {
  type: ImpactStyle | NotificationType;
  count?: number;
  interval?: number;
}

/**
 * Sleep helper for pattern timing
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Single impact feedback
 */
export async function impact(style: ImpactStyle = 'medium'): Promise<void> {
  try {
    switch (style) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }
  } catch (error) {
    console.warn('Haptics not available:', error);
  }
}

/**
 * Notification feedback
 */
export async function notify(type: NotificationType): Promise<void> {
  try {
    switch (type) {
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch (error) {
    console.warn('Haptics not available:', error);
  }
}

/**
 * Selection feedback (light tap)
 */
export async function selection(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    console.warn('Haptics not available:', error);
  }
}

/**
 * Play a haptic pattern (multiple pulses)
 */
export async function playPattern(pattern: HapticPattern): Promise<void> {
  const count = pattern.count || 1;
  const interval = pattern.interval || 100;
  
  for (let i = 0; i < count; i++) {
    // Check if it's a notification type or impact type
    if (['success', 'warning', 'error'].includes(pattern.type)) {
      await notify(pattern.type as NotificationType);
    } else {
      await impact(pattern.type as ImpactStyle);
    }
    
    // Wait between pulses (except after last one)
    if (i < count - 1) {
      await sleep(interval);
    }
  }
}

// ============================================
// Pre-defined patterns for common interactions
// ============================================

/**
 * Button press feedback
 */
export async function buttonPress(): Promise<void> {
  await playPattern(HAPTIC_PATTERNS.buttonPress);
}

/**
 * Button activation (e.g., camera start)
 */
export async function buttonActivate(): Promise<void> {
  await playPattern(HAPTIC_PATTERNS.buttonActivate);
}

/**
 * Photo capture confirmation (triple tap)
 */
export async function photoCapture(): Promise<void> {
  await playPattern(HAPTIC_PATTERNS.photoCapture);
}

/**
 * Camera started
 */
export async function cameraStart(): Promise<void> {
  await playPattern(HAPTIC_PATTERNS.cameraStart);
}

/**
 * Camera stopped
 */
export async function cameraStop(): Promise<void> {
  await playPattern(HAPTIC_PATTERNS.cameraStop);
}

/**
 * Obstacle close warning
 */
export async function obstacleClose(): Promise<void> {
  await playPattern(HAPTIC_PATTERNS.obstacleClose);
}

/**
 * Obstacle very close - urgent warning
 */
export async function obstacleVeryClose(): Promise<void> {
  await playPattern(HAPTIC_PATTERNS.obstacleVeryClose);
}

/**
 * Direction indicator - left
 */
export async function directionLeft(): Promise<void> {
  await playPattern(HAPTIC_PATTERNS.directionLeft);
}

/**
 * Direction indicator - right
 */
export async function directionRight(): Promise<void> {
  await playPattern(HAPTIC_PATTERNS.directionRight);
}

/**
 * Path is clear
 */
export async function pathClear(): Promise<void> {
  await playPattern(HAPTIC_PATTERNS.pathClear);
}

/**
 * Warning based on obstacle distance
 */
export async function obstacleWarning(distance: 'very_close' | 'close' | 'medium' | 'far'): Promise<void> {
  switch (distance) {
    case 'very_close':
      await obstacleVeryClose();
      break;
    case 'close':
      await obstacleClose();
      break;
    case 'medium':
      await impact('light');
      break;
    default:
      // No haptic for far objects
      break;
  }
}

export default {
  impact,
  notify,
  selection,
  playPattern,
  buttonPress,
  buttonActivate,
  photoCapture,
  cameraStart,
  cameraStop,
  obstacleClose,
  obstacleVeryClose,
  directionLeft,
  directionRight,
  pathClear,
  obstacleWarning,
};
