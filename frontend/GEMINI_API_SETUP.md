# Gemini API Setup Guide

## Current Issue
The system is showing "API key not valid" errors because the Gemini API key needs to be configured.

## Quick Fix Options

### Option 1: Use Environment Variable (Recommended)
1. Create a `.env` file in the `frontend` directory
2. Add your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your-actual-gemini-api-key-here
   ```
3. Restart the development server

### Option 2: Direct Configuration
1. Edit `frontend/src/config/gemini.ts`
2. Replace the API key on line 4:
   ```typescript
   API_KEY: 'your-actual-gemini-api-key-here',
   ```

## Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Use it in one of the options above

## Current Status

The system is currently using a placeholder API key that's not valid. Once you add a valid API key, the AI-powered features will work properly.

## Fallback Mode

Even without a valid API key, the system will:
- ✅ Use fallback generation (traditional algorithm)
- ✅ Enforce all constraints (max 3 theory sessions, no consecutive sessions, etc.)
- ✅ Use correct time slots (8:10-10:10, 10:25-12:15, etc.)
- ✅ Include Saturday scheduling
- ✅ Proper lab batch distribution (A, B, C)

The only difference is that you won't get AI-powered optimization suggestions, but the core functionality works perfectly.

## Testing Without API Key

You can test the system right now:
1. Go to "Generate Timetable" 
2. Click "Generate AI-Optimized Timetable"
3. It will use fallback mode and still generate a proper timetable
4. Check the console logs to see constraint enforcement in action

The system is designed to work reliably even without AI, so you can use it immediately while setting up the API key.
