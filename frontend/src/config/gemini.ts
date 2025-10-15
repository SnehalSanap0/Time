// Gemini AI Configuration
export const GEMINI_CONFIG = {
  // You can set your Gemini API key here or use environment variables
  API_KEY: 'your-gemini-api-key-here',
  
  // Model configuration
  MODEL_NAME: 'gemini-1.5-flash',
  
  // Generation settings
  GENERATION_CONFIG: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 8192,
  },
  
  // Cache settings
  CACHE_ENABLED: true,
  CACHE_TTL: 3600000, // 1 hour in milliseconds
  
  // Fallback settings
  FALLBACK_ENABLED: true,
  MIN_CONFIDENCE_THRESHOLD: 70,
};

// Instructions for setting up Gemini API key:
// 1. Go to https://makersuite.google.com/app/apikey
// 2. Create a new API key
// 3. Set the environment variable: VITE_GEMINI_API_KEY=your-actual-api-key
// 4. Or replace 'your-gemini-api-key-here' in this file with your actual key
