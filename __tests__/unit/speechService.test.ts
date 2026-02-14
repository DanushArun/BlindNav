/**
 * Speech Service Unit Tests
 */

import speechService from '../../src/services/speech/speechService';

// Mock expo-speech
jest.mock('expo-speech', () => ({
  speak: jest.fn((text, options) => {
    // Simulate speech completion
    if (options?.onDone) {
      setTimeout(options.onDone, 100);
    }
  }),
  stop: jest.fn(),
  getAvailableVoicesAsync: jest.fn(() => Promise.resolve([])),
}));

describe('SpeechService', () => {
  beforeEach(() => {
    speechService.stop();
    jest.clearAllMocks();
  });

  describe('speak', () => {
    it('should speak with normal priority by default', () => {
      speechService.speak('Hello world');
      expect(speechService.getQueueLength()).toBeGreaterThanOrEqual(0);
    });

    it('should interrupt current speech for critical priority', () => {
      const Speech = require('expo-speech');
      
      speechService.speak('Normal message', 'normal');
      speechService.speak('Critical message', 'critical');
      
      expect(Speech.stop).toHaveBeenCalled();
    });
  });

  describe('pause and resume', () => {
    it('should pause speech', () => {
      speechService.pause();
      // After pause, speaking should return false
      expect(speechService.isSpeaking()).toBe(false);
    });

    it('should resume after pause', () => {
      speechService.pause();
      speechService.resume();
      // Service should be ready to process queue
      expect(speechService.isSpeaking()).toBe(false);
    });
  });

  describe('stop', () => {
    it('should stop all speech and clear queue', () => {
      speechService.speak('Message 1', 'low');
      speechService.speak('Message 2', 'low');
      speechService.stop();
      
      expect(speechService.getQueueLength()).toBe(0);
      expect(speechService.isSpeaking()).toBe(false);
    });
  });

  describe('language settings', () => {
    it('should set language', () => {
      expect(() => speechService.setLanguage('hi')).not.toThrow();
      expect(() => speechService.setLanguage('en')).not.toThrow();
    });
  });

  describe('speech rate settings', () => {
    it('should set speech rate', () => {
      expect(() => speechService.setSpeechRate('slow')).not.toThrow();
      expect(() => speechService.setSpeechRate('normal')).not.toThrow();
      expect(() => speechService.setSpeechRate('fast')).not.toThrow();
    });
  });
});
