/**
 * Gemini Live Streaming Service
 * Real-time multimodal streaming with camera + audio
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('GEMINI_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

// Use Gemini 2.5 Flash with native audio streaming
const MODEL_NAME = 'gemini-2.0-flash-exp'; // Update to 2.5 when available

interface StreamCallbacks {
  onAudioChunk: (audio: Uint8Array) => void;
  onText: (text: string) => void;
  onError: (error: Error) => void;
}

/**
 * Gemini Live Session Manager
 * Handles bidirectional streaming of video + audio
 */
export class GeminiLiveSession {
  private model: any;
  private session: any = null;
  private isStreaming: boolean = false;
  
  constructor(private callbacks: StreamCallbacks) {
    this.model = genAI.getGenerativeModel({
      model: MODEL_NAME,
    });
  }
  
  /**
   * Start live streaming session
   */
  async start(systemPrompt: string) {
    if (this.isStreaming) {
      console.warn('Session already active');
      return;
    }
    
    try {
      // Initialize streaming session
      // Note: This is conceptual - actual implementation depends on final Gemini Live SDK
      this.session = await this.model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      });
      
      this.isStreaming = true;
      console.log('Gemini Live session started');
    } catch (error) {
      console.error('Failed to start Gemini Live:', error);
      this.callbacks.onError(error as Error);
    }
  }
  
  /**
   * Stream camera frame
   * @param imageData - Base64 encoded image frame
   */
  async streamFrame(imageData: string) {
    if (!this.isStreaming || !this.session) {
      console.warn('Session not active');
      return;
    }
    
    try {
      // Send frame to Gemini
      const result = await this.session.sendMessage([
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageData,
          },
        },
      ]);
      
      const response = result.response;
      const text = response.text();
      
      if (text) {
        this.callbacks.onText(text);
      }
    } catch (error) {
      console.error('Frame streaming error:', error);
      this.callbacks.onError(error as Error);
    }
  }
  
  /**
   * Stream audio input (for voice commands)
   * @param audioData - PCM audio data
   */
  async streamAudio(audioData: Uint8Array) {
    if (!this.isStreaming || !this.session) {
      return;
    }
    
    try {
      // Stream audio to Gemini
      // This will enable voice commands from the blind user
      const result = await this.session.sendMessage([
        {
          inlineData: {
            mimeType: 'audio/pcm',
            data: Buffer.from(audioData).toString('base64'),
          },
        },
      ]);
      
      const response = result.response;
      const text = response.text();
      
      if (text) {
        this.callbacks.onText(text);
      }
    } catch (error) {
      console.error('Audio streaming error:', error);
    }
  }
  
  /**
   * Send text message (for debugging or commands)
   */
  async sendText(text: string) {
    if (!this.isStreaming || !this.session) {
      return;
    }
    
    try {
      const result = await this.session.sendMessage(text);
      const response = result.response;
      const responseText = response.text();
      
      if (responseText) {
        this.callbacks.onText(responseText);
      }
    } catch (error) {
      console.error('Text message error:', error);
    }
  }
  
  /**
   * Stop streaming session
   */
  stop() {
    this.isStreaming = false;
    this.session = null;
    console.log('Gemini Live session stopped');
  }
  
  /**
   * Check if session is active
   */
  isActive(): boolean {
    return this.isStreaming;
  }
}

/**
 * System prompt for blind navigation
 */
export const BLIND_NAVIGATION_PROMPT = `You are an AI assistant helping a blind person navigate in real-time. 

Your job:
1. Describe the environment concisely as the camera moves
2. Alert about obstacles, hazards, people, vehicles IMMEDIATELY
3. Use spatial language: "on your left", "ahead", "behind you"
4. Prioritize safety: stairs, drop-offs, moving vehicles
5. Keep responses SHORT and ACTIONABLE
6. Update continuously as the scene changes

Response format:
- Critical alerts: "STOP - car approaching from right!"
- Obstacles: "Person 3 feet ahead on your left"
- Scene updates: "You're entering a shop, counter on right"
- Clear path: "Path clear, continue straight"

Be conversational, urgent when needed, calm otherwise.
Start by saying "Camera active, I'm watching" when the stream begins.`;

export default {
  GeminiLiveSession,
  BLIND_NAVIGATION_PROMPT,
};
