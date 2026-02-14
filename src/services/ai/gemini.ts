/**
 * Gemini AI Service
 * Handles image analysis using Google's Gemini 2.0 Flash Vision API
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG, GEMINI_PROMPT } from '../../constants';
import { GeminiResponse, SceneDescription, Detection } from '../../types';

// Initialize Gemini client
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

// Use Gemini 2.0 Flash for fast vision processing
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
  generationConfig: {
    temperature: 0.3, // Lower temperature for consistent responses
    topK: 1,
    topP: 0.8,
    maxOutputTokens: 500, // Keep responses concise
  },
});

// Rate limiting
let lastRequestTime = 0;
let requestCount = 0;
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = AI_CONFIG.GEMINI_RPM - 2; // Leave buffer

/**
 * Check if we can make a request (rate limiting)
 */
function canMakeRequest(): boolean {
  const now = Date.now();
  
  // Reset counter if window passed
  if (now - lastRequestTime > RATE_LIMIT_WINDOW) {
    requestCount = 0;
  }
  
  return requestCount < MAX_REQUESTS_PER_MINUTE;
}

/**
 * Convert base64 image to Gemini-compatible format
 */
function prepareImagePart(base64Image: string) {
  // Remove data URL prefix if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  
  return {
    inlineData: {
      data: base64Data,
      mimeType: 'image/jpeg',
    },
  };
}

/**
 * Parse Gemini response into structured data
 */
function parseGeminiResponse(responseText: string): GeminiResponse | null {
  try {
    // Extract JSON from response (in case there's extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No JSON found in Gemini response');
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]) as GeminiResponse;
    return parsed;
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    return null;
  }
}

/**
 * Convert Gemini response to internal SceneDescription format
 */
function toSceneDescription(geminiResponse: GeminiResponse): SceneDescription {
  const detections: Detection[] = geminiResponse.objects.map((obj, index) => ({
    id: `obj-${index}`,
    type: obj.name.toLowerCase(),
    label: obj.name,
    confidence: 0.9, // Gemini doesn't provide confidence scores
    distance: mapDistance(obj.distance),
    position: mapPosition(obj.position),
  }));
  
  return {
    summary: geminiResponse.scene,
    objects: detections,
    text: geminiResponse.text_visible,
    warnings: geminiResponse.warnings,
    timestamp: Date.now(),
  };
}

function mapDistance(distance: string): Detection['distance'] {
  const d = distance.toLowerCase();
  if (d.includes('very close') || d.includes('immediate')) return 'very_close';
  if (d.includes('close') || d.includes('near')) return 'close';
  if (d.includes('far') || d.includes('distant')) return 'far';
  return 'medium';
}

function mapPosition(position: string): Detection['position'] {
  const p = position.toLowerCase();
  if (p.includes('left')) return 'left';
  if (p.includes('right')) return 'right';
  return 'center';
}

/**
 * Analyze an image using Gemini Vision
 * @param base64Image - Base64 encoded image data
 * @returns SceneDescription or null if failed
 */
export async function analyzeImage(base64Image: string): Promise<SceneDescription | null> {
  // Check rate limit
  if (!canMakeRequest()) {
    console.warn('Rate limit reached, skipping analysis');
    return null;
  }
  
  try {
    const imagePart = prepareImagePart(base64Image);
    
    const result = await model.generateContent([
      GEMINI_PROMPT,
      imagePart,
    ]);
    
    // Update rate limiting
    lastRequestTime = Date.now();
    requestCount++;
    
    const response = result.response;
    const responseText = response.text();
    
    console.log('Gemini raw response:', responseText.substring(0, 200));
    
    const parsed = parseGeminiResponse(responseText);
    
    if (!parsed) {
      return null;
    }
    
    return toSceneDescription(parsed);
  } catch (error) {
    console.error('Gemini analysis failed:', error);
    return null;
  }
}

/**
 * Generate a description for a captured photo
 * @param base64Image - Base64 encoded image
 * @returns Text description of the photo
 */
export async function describePhoto(base64Image: string): Promise<string> {
  if (!canMakeRequest()) {
    return 'Photo saved. Description not available due to rate limiting.';
  }
  
  try {
    const imagePart = prepareImagePart(base64Image);
    
    const result = await model.generateContent([
      'Describe this photo in 1-2 sentences for a blind person. Be descriptive but concise. Focus on people, setting, and mood.',
      imagePart,
    ]);
    
    lastRequestTime = Date.now();
    requestCount++;
    
    return result.response.text().trim();
  } catch (error) {
    console.error('Photo description failed:', error);
    return 'Photo saved. Could not generate description.';
  }
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(): { remaining: number; resetsIn: number } {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  const resetsIn = Math.max(0, RATE_LIMIT_WINDOW - timeSinceLastRequest);
  const remaining = Math.max(0, MAX_REQUESTS_PER_MINUTE - requestCount);
  
  return { remaining, resetsIn };
}

export default {
  analyzeImage,
  describePhoto,
  getRateLimitStatus,
};
