import { GoogleGenerativeAI } from '@google/generative-ai';
import { Subject, Faculty, Classroom, Lab, TimetableSlot, TimetableConstraints } from '../types/timetable';
import { GEMINI_CONFIG } from '../config/gemini';
import CryptoJS from 'crypto-js';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_CONFIG.API_KEY);
const model = genAI.getGenerativeModel({ 
  model: GEMINI_CONFIG.MODEL_NAME,
  generationConfig: GEMINI_CONFIG.GENERATION_CONFIG
});

export interface ConstraintAnalysisResult {
  isValid: boolean;
  conflicts: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    severity: 'low' | 'medium' | 'high';
    affectedEntities: string[];
    suggestedFix?: string;
  }>;
  optimizationSuggestions: string[];
  constraintScore: number;
  recommendedSlots: Array<{
    subject: string;
    faculty: string;
    day: string;
    time: string;
    room: string;
    type: 'theory' | 'lab';
    batch?: 'A' | 'B' | 'C';
    confidence: number;
    reasoning: string;
  }>;
}

export interface TimetableContext {
  subjects: Subject[];
  faculty: Faculty[];
  classrooms: Classroom[];
  labs: Lab[];
  constraints: TimetableConstraints;
  existingSlots: TimetableSlot[];
  targetYear: 'SE' | 'TE' | 'BE';
  targetSemester: number;
}

export class GeminiConstraintAnalyzer {
  private static instance: GeminiConstraintAnalyzer;
  private cache: Map<string, ConstraintAnalysisResult> = new Map();

  private constructor() {}

  public static getInstance(): GeminiConstraintAnalyzer {
    if (!GeminiConstraintAnalyzer.instance) {
      GeminiConstraintAnalyzer.instance = new GeminiConstraintAnalyzer();
    }
    return GeminiConstraintAnalyzer.instance;
  }

  /**
   * Generate a deterministic hash for consistent caching
   */
  private generateContextHash(context: TimetableContext): string {
    const contextString = JSON.stringify({
      subjects: context.subjects.map(s => ({ id: s.id, name: s.name, code: s.code, year: s.year, theoryHours: s.theoryHours, labHours: s.labHours, faculty: s.faculty, semester: s.semester })),
      faculty: context.faculty.map(f => ({ id: f.id, name: f.name, department: f.department, subjects: f.subjects, maxHoursPerDay: f.maxHoursPerDay, preferredSlots: f.preferredSlots })),
      classrooms: context.classrooms.map(c => ({ id: c.id, name: c.name, capacity: c.capacity, assignedYear: c.assignedYear })),
      labs: context.labs.map(l => ({ id: l.id, name: l.name, capacity: l.capacity, type: l.type, compatibleSubjects: l.compatibleSubjects })),
      constraints: context.constraints,
      targetYear: context.targetYear,
      targetSemester: context.targetSemester,
      existingSlots: context.existingSlots.map(s => ({ id: s.id, day: s.day, time: s.time, subject: s.subject, faculty: s.faculty, room: s.room, type: s.type, year: s.year, batch: s.batch, duration: s.duration, semester: s.semester }))
    });
    return CryptoJS.SHA256(contextString).toString();
  }

  /**
   * Analyze constraints and generate intelligent recommendations
   */
  public async analyzeConstraints(context: TimetableContext): Promise<ConstraintAnalysisResult> {
    const contextHash = this.generateContextHash(context);
    
    // Check cache first for consistent results (if caching is enabled)
    if (GEMINI_CONFIG.CACHE_ENABLED && this.cache.has(contextHash)) {
      console.log('Using cached constraint analysis result');
      return this.cache.get(contextHash)!;
    }

    try {
      const prompt = this.buildAnalysisPrompt(context);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const analysisResult = this.parseAnalysisResponse(text, context);
      
      // Cache the result for consistency (if caching is enabled)
      if (GEMINI_CONFIG.CACHE_ENABLED) {
        this.cache.set(contextHash, analysisResult);
      }
      
      return analysisResult;
    } catch (error) {
      console.error('Error analyzing constraints with Gemini:', error);
      // Return fallback analysis
      return this.getFallbackAnalysis(context);
    }
  }

  /**
   * Build comprehensive prompt for constraint analysis
   */
  private buildAnalysisPrompt(context: TimetableContext): string {
    const { subjects, faculty, classrooms, labs, constraints, existingSlots, targetYear, targetSemester } = context;
    
    const relevantSubjects = subjects.filter(s => s.year === targetYear && s.semester === targetSemester);
    const relevantFaculty = faculty.filter(f => 
      relevantSubjects.some(s => f.subjects.includes(s.code) || f.name === (typeof s.faculty === 'object' ? s.faculty.name : s.faculty))
    );
    const yearClassrooms = classrooms.filter(c => c.assignedYear === targetYear);

    return `
You are an expert timetable optimization AI. Analyze the following academic timetable constraints and provide intelligent recommendations for generating a consistent, optimal timetable.

CONTEXT:
- Target: ${targetYear} Year, Semester ${targetSemester}
- Total subjects to schedule: ${relevantSubjects.length}
- Available faculty: ${relevantFaculty.length}
- Available classrooms: ${yearClassrooms.length}
- Available labs: ${labs.length}
- Existing scheduled slots: ${existingSlots.length}

SUBJECTS TO SCHEDULE:
${relevantSubjects.map(s => `- ${s.name} (${s.code}): ${s.theoryHours}h theory, ${s.labHours}h lab, Faculty: ${typeof s.faculty === 'object' ? s.faculty.name : s.faculty}`).join('\n')}

FACULTY CONSTRAINTS:
${relevantFaculty.map(f => `- ${f.name}: Max ${f.maxHoursPerDay}h/day, Preferred: ${f.preferredSlots.join(', ') || 'No preference'}, Subjects: ${f.subjects.join(', ')}`).join('\n')}

INFRASTRUCTURE:
Classrooms: ${yearClassrooms.map(c => `${c.name} (${c.capacity} seats)`).join(', ')}
Labs: ${labs.map(l => `${l.name} (${l.type}, ${l.capacity} seats)`).join(', ')}

CONSTRAINTS:
- Max hours per day: ${constraints.maxHoursPerDay}
- Min break between classes: ${constraints.minBreakBetweenClasses} minutes
- Max consecutive hours: ${constraints.maxConsecutiveHours}
- Prioritize labs in afternoon: ${constraints.prioritizeLabAfternoon}
- Allow back-to-back theory: ${constraints.allowBackToBackTheory}
- Faculty rest slots: ${constraints.facultyRestSlots}

EXISTING SCHEDULE:
${existingSlots.map(s => `- ${s.day} ${s.time}: ${s.subject} (${s.faculty}) in ${s.room} [${s.type}]`).join('\n')}

AVAILABLE TIME SLOTS:
Morning Batch (8:10-2:55):
- Theory: 8:10-10:10 (2 hours), 10:25-12:15 (1h 50m), 1:05-2:55 (1h 50m)
- Labs: 8:10-10:10, 10:25-12:15, 1:05-2:55

Afternoon Batch (3:05-4:55):
- Theory: 3:05-4:55 (1h 50m)
- Labs: 3:05-4:55

Breaks: 10:10-10:25, 12:15-1:05, 2:55-3:05

DAYS: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday

CRITICAL CONSTRAINTS (MUST BE ENFORCED - VIOLATIONS WILL CAUSE GENERATION FAILURE):
1. MAXIMUM 3 THEORY LECTURES PER SUBJECT PER WEEK - NO EXCEPTIONS
   - Example: If DBMS has 4 theory sessions, this is INVALID
   - Each subject can have AT MOST 3 theory sessions per week

2. NO CONSECUTIVE SESSIONS OF THE SAME SUBJECT - MUST HAVE BREAKS
   - Example: AI at 10:15-11:15 followed by AI at 11:15-12:15 is INVALID
   - There must be at least one time slot gap between same subject sessions

3. LAB SESSIONS: Each subject's lab should be scheduled EXACTLY ONCE per batch per week
   - Example: DBMS Lab for Batch A should appear only ONCE in the week
   - Each lab subject must have sessions for ALL THREE BATCHES (A, B, C)

4. ALL BATCHES (A, B, C) MUST BE SCHEDULED for lab subjects
   - If a subject has lab hours, it must have sessions for Batch A, Batch B, AND Batch C
   - Missing any batch is INVALID

5. NO DOUBLE BOOKING of faculty, rooms, or students
   - Same faculty cannot teach two classes at the same time
   - Same room cannot be used for two classes at the same time
   - Same student batch cannot have two classes at the same time

ANALYSIS REQUIREMENTS:
1. Identify all constraint violations and conflicts
2. Provide optimization suggestions
3. Recommend specific slot assignments with confidence scores
4. Ensure consistency for identical inputs
5. Consider faculty preferences and workload balance
6. Optimize resource utilization
7. ENFORCE THE CRITICAL CONSTRAINTS ABOVE

RESPONSE FORMAT (JSON):
{
  "isValid": boolean,
  "conflicts": [
    {
      "type": "error|warning|info",
      "message": "description",
      "severity": "low|medium|high",
      "affectedEntities": ["entity1", "entity2"],
      "suggestedFix": "optional fix suggestion"
    }
  ],
  "optimizationSuggestions": ["suggestion1", "suggestion2"],
  "constraintScore": number (0-100),
  "recommendedSlots": [
    {
      "subject": "subject name",
      "faculty": "faculty name",
      "day": "Monday|Tuesday|Wednesday|Thursday|Friday",
      "time": "time slot",
      "room": "room name",
      "type": "theory|lab",
      "confidence": number (0-100),
      "reasoning": "explanation for this assignment"
    }
  ]
}

Provide a comprehensive analysis focusing on:
- Hard constraint violations (faculty conflicts, room double-booking, student conflicts)
- Soft constraint optimization (faculty preferences, workload balance, resource utilization)
- Intelligent slot recommendations with clear reasoning
- Consistency measures to ensure identical inputs produce identical outputs
`;
  }

  /**
   * Parse the AI response into structured data
   */
  private parseAnalysisResponse(response: string, context: TimetableContext): ConstraintAnalysisResult {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;
      
      const parsed = JSON.parse(jsonString);
      
      // Validate and sanitize the response
      return {
        isValid: Boolean(parsed.isValid),
        conflicts: Array.isArray(parsed.conflicts) ? parsed.conflicts.map((c: any) => ({
          type: ['error', 'warning', 'info'].includes(c.type) ? c.type : 'info',
          message: String(c.message || ''),
          severity: ['low', 'medium', 'high'].includes(c.severity) ? c.severity : 'medium',
          affectedEntities: Array.isArray(c.affectedEntities) ? c.affectedEntities : [],
          suggestedFix: c.suggestedFix ? String(c.suggestedFix) : undefined
        })) : [],
        optimizationSuggestions: Array.isArray(parsed.optimizationSuggestions) ? parsed.optimizationSuggestions : [],
        constraintScore: Math.max(0, Math.min(100, Number(parsed.constraintScore) || 0)),
        recommendedSlots: Array.isArray(parsed.recommendedSlots) ? parsed.recommendedSlots.map((s: any) => ({
          subject: String(s.subject || ''),
          faculty: String(s.faculty || ''),
          day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(s.day) ? s.day : 'Monday',
          time: String(s.time || ''),
          room: String(s.room || ''),
          type: ['theory', 'lab'].includes(s.type) ? s.type : 'theory',
          confidence: Math.max(0, Math.min(100, Number(s.confidence) || 0)),
          reasoning: String(s.reasoning || '')
        })) : []
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return this.getFallbackAnalysis(context);
    }
  }

  /**
   * Fallback analysis when AI is unavailable
   */
  private getFallbackAnalysis(context: TimetableContext): ConstraintAnalysisResult {
    const { subjects, classrooms, targetYear, targetSemester } = context;
    const relevantSubjects = subjects.filter(s => s.year === targetYear && s.semester === targetSemester);
    const yearClassrooms = classrooms.filter(c => c.assignedYear === targetYear);

    const conflicts = [];
    
    if (relevantSubjects.length === 0) {
      conflicts.push({
        type: 'error' as const,
        message: `No subjects found for ${targetYear} Semester ${targetSemester}`,
        severity: 'high' as const,
        affectedEntities: [`${targetYear}-${targetSemester}`]
      });
    }

    if (yearClassrooms.length === 0) {
      conflicts.push({
        type: 'error' as const,
        message: `No classrooms assigned to ${targetYear}`,
        severity: 'high' as const,
        affectedEntities: [targetYear]
      });
    }

    return {
      isValid: conflicts.length === 0,
      conflicts,
      optimizationSuggestions: [
        'Ensure all subjects have assigned faculty',
        'Balance faculty workload across days',
        'Optimize lab utilization in afternoon slots'
      ],
      constraintScore: conflicts.length === 0 ? 85 : 30,
      recommendedSlots: []
    };
  }

  /**
   * Clear cache (useful for testing or when constraints change)
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const geminiAnalyzer = GeminiConstraintAnalyzer.getInstance();
