# AI-Powered Timetable Generation Setup

This document explains how to set up and use the AI-powered timetable generation system that uses Google's Gemini API for intelligent constraint analysis and consistent timetable generation.

## Features

- **AI-Powered Constraint Analysis**: Uses Gemini AI to analyze complex scheduling constraints
- **Intelligent Slot Recommendations**: AI provides specific slot assignments with confidence scores
- **Consistent Generation**: Ensures identical inputs produce identical timetables using deterministic hashing
- **Real-time Optimization**: Analyzes constraints in real-time and provides optimization suggestions
- **Fallback Support**: Gracefully falls back to traditional generation if AI is unavailable

## Setup Instructions

### 1. Install Dependencies

The required dependencies are already added to `package.json`:

```bash
npm install
```

### 2. Configure Gemini API Key

#### Option A: Environment Variable (Recommended)
Create a `.env` file in the frontend directory:

```env
VITE_GEMINI_API_KEY=your-actual-gemini-api-key-here
```

#### Option B: Direct Configuration
Edit `frontend/src/config/gemini.ts` and replace `'your-gemini-api-key-here'` with your actual API key.

### 3. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Add it to your configuration (see step 2)

### 4. Start the Application

```bash
npm run dev
```

## How It Works

### 1. AI Constraint Analysis
- The system sends comprehensive context about subjects, faculty, classrooms, labs, and constraints to Gemini AI
- Gemini analyzes the constraints and provides intelligent recommendations
- Results are cached for consistency using deterministic hashing

### 2. Intelligent Slot Assignment
- AI recommendations are processed first (high confidence slots)
- Traditional scheduling logic fills remaining slots with AI insights
- Each slot is validated against all constraints

### 3. Consistency Guarantees
- Input data is hashed deterministically to ensure identical inputs produce identical outputs
- AI analysis results are cached to maintain consistency
- Generation statistics include a consistency hash for verification

### 4. Real-time Optimization
- AI provides optimization suggestions for better resource utilization
- Faculty workload is analyzed and balanced
- Room utilization is optimized

## Configuration Options

Edit `frontend/src/config/gemini.ts` to customize:

```typescript
export const GEMINI_CONFIG = {
  API_KEY: 'your-api-key',
  MODEL_NAME: 'gemini-1.5-flash',
  GENERATION_CONFIG: {
    temperature: 0.7,        // Lower = more deterministic
    topP: 0.8,              // Nucleus sampling
    topK: 40,               // Top-k sampling
    maxOutputTokens: 8192,  // Maximum response length
  },
  CACHE_ENABLED: true,      // Enable/disable caching
  CACHE_TTL: 3600000,       // Cache time-to-live (1 hour)
  FALLBACK_ENABLED: true,   // Enable fallback to traditional generation
  MIN_CONFIDENCE_THRESHOLD: 70, // Minimum confidence for AI recommendations
};
```

## Usage

1. **Configure Generation Settings**: Set year, semester, and constraints in the UI
2. **Click "Generate AI-Optimized Timetable"**: The system will:
   - Analyze constraints with Gemini AI
   - Generate intelligent slot recommendations
   - Create optimized timetable
   - Display AI analysis results and statistics
3. **Review Results**: Check the AI Analysis Results section for:
   - Constraint satisfaction score
   - Optimization suggestions
   - AI slot recommendations with confidence scores
   - Generation statistics

## AI Analysis Results

The system displays comprehensive AI analysis including:

- **Constraint Score**: Overall satisfaction percentage (0-100%)
- **Valid Configuration**: Whether the configuration is feasible
- **AI Recommendations**: Specific slot assignments with confidence scores
- **Optimization Suggestions**: AI-generated recommendations for improvement
- **Generation Statistics**: Faculty utilization, room utilization, consistency hash

## Troubleshooting

### API Key Issues
- Ensure your Gemini API key is valid and has sufficient quota
- Check that the API key is properly configured in your environment or config file

### AI Analysis Failures
- The system automatically falls back to traditional generation if AI is unavailable
- Check the browser console for error messages
- Verify your internet connection

### Inconsistent Results
- Ensure caching is enabled in the configuration
- Check that input data is identical between generations
- Verify the consistency hash in generation statistics

## Performance Considerations

- **Caching**: Results are cached to improve performance and ensure consistency
- **Fallback**: Traditional generation is used if AI is unavailable
- **Rate Limiting**: Gemini API has rate limits; the system handles this gracefully
- **Response Time**: AI analysis typically takes 2-5 seconds depending on complexity

## Security Notes

- Keep your Gemini API key secure and never commit it to version control
- Use environment variables for production deployments
- The API key is only used for constraint analysis and doesn't store personal data

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify your API key configuration
3. Ensure all dependencies are installed
4. Check the fallback generation if AI is unavailable
