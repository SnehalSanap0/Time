import { Subject, Faculty, Classroom, Lab, TimetableSlot, TimetableConstraints, Conflict } from '../types/timetable';
import { geminiAnalyzer, ConstraintAnalysisResult, TimetableContext } from '../services/geminiService';
import CryptoJS from 'crypto-js';

// Helper types for tracking unscheduled sessions
type UnscheduledLecture = { subject: Subject; year: 'SE' | 'TE' | 'BE'; }
type UnscheduledLab = { subject: Subject; year: 'SE' | 'TE' | 'BE'; batch: 'A' | 'B' | 'C'; }

export interface AIGenerationResult {
  slots: TimetableSlot[];
  conflicts: Conflict[];
  analysisResult: ConstraintAnalysisResult;
  generationStats: {
    totalSlots: number;
    theorySlots: number;
    labSlots: number;
    facultyUtilization: number;
    roomUtilization: number;
    constraintScore: number;
    consistencyHash: string;
  };
}

export class AITimetableGenerator {
  private subjects: Subject[];
  private faculty: Faculty[];
  private classrooms: Classroom[];
  private labs: Lab[];
  private constraints: TimetableConstraints;
  private generatedSlots: TimetableSlot[] = [];
  private conflicts: Conflict[] = [];
  private analysisResult: ConstraintAnalysisResult | null = null;

  private readonly DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Morning batch slots (8:10-2:55)
  private readonly MORNING_THEORY_SLOTS = [
    '8:10-10:10',  // 2 hours
    '10:25-12:15', // 1 hour 50 minutes
    '1:05-2:55'    // 1 hour 50 minutes
  ];
  
  // Afternoon batch slots (3:05-4:55)
  private readonly AFTERNOON_THEORY_SLOTS = [
    '3:05-4:55'    // 1 hour 50 minutes
  ];
  
  // Lab slots (can accommodate multiple practicals)
  private readonly LAB_SLOTS = [
    '8:10-10:10',  // Morning lab slot
    '10:25-12:15', // Morning lab slot
    '1:05-2:55',   // Morning lab slot
    '3:05-4:55'    // Afternoon lab slot
  ];
  
  // All available slots for scheduling
  private readonly ALL_THEORY_SLOTS = [
    ...this.MORNING_THEORY_SLOTS,
    ...this.AFTERNOON_THEORY_SLOTS
  ];

  constructor(
    subjects: Subject[], faculty: Faculty[], classrooms: Classroom[],
    labs: Lab[], constraints: TimetableConstraints
  ) {
    this.subjects = subjects;
    this.faculty = faculty;
    this.classrooms = classrooms;
    this.labs = labs;
    this.constraints = constraints;
  }

  /**
   * Generate timetable using AI-powered constraint analysis
   */
  public async generateTimetable(
    targetYear: 'SE' | 'TE' | 'BE',
    targetSemester: number
  ): Promise<AIGenerationResult> {
    this.generatedSlots = [];
    this.conflicts = [];

    try {
      // Step 1: AI Constraint Analysis
      const context: TimetableContext = {
        subjects: this.subjects,
        faculty: this.faculty,
        classrooms: this.classrooms,
        labs: this.labs,
        constraints: this.constraints,
        existingSlots: this.generatedSlots,
        targetYear,
        targetSemester
      };

      this.analysisResult = await geminiAnalyzer.analyzeConstraints(context);

      // Step 2: Generate slots based on AI recommendations
      await this.generateSlotsWithAI(targetYear, targetSemester);

      // Step 3: Validate and optimize
      this.validateAndOptimize();

      // Step 4: Calculate statistics
      const stats = this.calculateGenerationStats(targetYear, targetSemester);

      return {
        slots: this.generatedSlots,
        conflicts: this.conflicts,
        analysisResult: this.analysisResult,
        generationStats: stats
      };

    } catch (error) {
      console.error('Error in AI timetable generation:', error);
      console.log('Falling back to traditional generation...');
      
      // Fallback to traditional generation
      return this.fallbackGeneration(targetYear, targetSemester);
    }
  }

  /**
   * Generate slots using AI recommendations
   */
  private async generateSlotsWithAI(targetYear: 'SE' | 'TE' | 'BE', targetSemester: number): Promise<void> {
    if (!this.analysisResult) {
      throw new Error('AI analysis not available');
    }

    const relevantSubjects = this.subjects.filter(s => s.year === targetYear && s.semester === targetSemester);
    const yearClassrooms = this.classrooms.filter(c => c.assignedYear === targetYear);

    // Use AI recommendations as primary guidance
    const aiRecommendations = this.analysisResult.recommendedSlots;
    
    // Process AI recommendations first
    for (const recommendation of aiRecommendations) {
      if (recommendation.confidence >= 70) { // Only use high-confidence recommendations
        const subject = relevantSubjects.find(s => s.name === recommendation.subject);
        if (subject && this.isSlotAvailable(recommendation.day, recommendation.time, recommendation.room)) {
          const slot = this.createSlotFromRecommendation(recommendation, subject, targetYear, targetSemester);
          if (slot && this.validateSlot(slot)) {
            this.generatedSlots.push(slot);
          }
        }
      }
    }

    // Fill remaining slots using traditional logic with AI insights
    const unscheduledLectures = this.createLecturePool(relevantSubjects);
    const unscheduledLabs = this.createLabPool(relevantSubjects);

    // Schedule labs with AI-enhanced logic
    await this.scheduleLabsWithAI(unscheduledLabs, targetYear);

    // Schedule lectures with AI-enhanced logic
    await this.scheduleLecturesWithAI(unscheduledLectures, targetYear, yearClassrooms);

    // Report unscheduled items
    this.reportUnscheduled(unscheduledLectures, unscheduledLabs);
  }

  /**
   * Create slot from AI recommendation
   */
  private createSlotFromRecommendation(
    recommendation: any,
    subject: Subject,
    targetYear: 'SE' | 'TE' | 'BE',
    targetSemester: number
  ): TimetableSlot | null {
    const facultyName = this.getFacultyName(subject);
    const duration = recommendation.type === 'lab' ? 2 : 1;
    const batch = recommendation.type === 'lab' ? this.getBatchForLab(subject, targetYear) : undefined;

    return {
      id: `${targetYear}-${recommendation.type === 'lab' ? batch : ''}-${subject.code}-${recommendation.day}-${recommendation.time}`,
      day: recommendation.day,
      time: recommendation.time,
      subject: recommendation.type === 'lab' ? `${subject.name} Lab` : subject.name,
      faculty: facultyName,
      room: recommendation.room,
      type: recommendation.type,
      year: targetYear,
      batch,
      duration,
      semester: targetSemester
    };
  }

  /**
   * Schedule labs with AI-enhanced logic supporting multiple practicals per slot
   */
  private async scheduleLabsWithAI(pool: UnscheduledLab[], _targetYear: 'SE' | 'TE' | 'BE'): Promise<void> {
    // Group labs by subject to ensure proper batch distribution
    const labsBySubject = new Map<string, UnscheduledLab[]>();
    pool.forEach(lab => {
      const key = `${lab.subject.name}-${lab.year}`;
      if (!labsBySubject.has(key)) {
        labsBySubject.set(key, []);
      }
      labsBySubject.get(key)!.push(lab);
    });

    // Schedule labs ensuring each subject gets all batches (A, B, C)
    for (const [, subjectLabs] of labsBySubject) {
      const batches = ['A', 'B', 'C'] as const;
      
      for (const batch of batches) {
        const batchLab = subjectLabs.find(lab => lab.batch === batch);
        if (!batchLab) continue;

        let scheduled = false;
        
        // Try to schedule this batch lab
        for (const day of this.DAYS) {
          if (scheduled) break;
          
          for (const time of this.LAB_SLOTS) {
            if (scheduled) break;
            
            if (this.isBatchAvailable(batchLab.year, batchLab.batch, day, time) &&
                this.isFacultyAvailable(this.getFacultyName(batchLab.subject), day, time) &&
                !this.hadConsecutiveLabForFaculty(this.getFacultyName(batchLab.subject), day, time) &&
                !this.hadConsecutiveLabForBatch(batchLab.year, batchLab.batch, day, time)) {
              
              const availableLabRooms = this.getAvailableRooms(day, time, 'lab') as Lab[];
              if (availableLabRooms.length > 0) {
                const labRoom = availableLabRooms[0];
                const slot: TimetableSlot = {
                  id: `${batchLab.year}-${batchLab.batch}-${batchLab.subject.code}-${day}-${time}`,
                  day, time, subject: `${batchLab.subject.name} Lab`,
                  faculty: this.getFacultyName(batchLab.subject), room: labRoom.name, type: 'lab',
                  year: batchLab.year, batch: batchLab.batch, duration: this.getSlotDuration(time), semester: batchLab.subject.semester
                };
                
                if (this.validateSlot(slot)) {
                  this.generatedSlots.push(slot);
                  const poolIndex = pool.findIndex(p => p === batchLab);
                  if (poolIndex > -1) pool.splice(poolIndex, 1);
                  scheduled = true;
                  console.log(`✅ Scheduled ${batchLab.subject.name} Lab for Batch ${batchLab.batch} on ${day} ${time}`);
                }
              }
            }
          }
        }
        
        if (!scheduled) {
          console.warn(`⚠️ Could not schedule ${batchLab.subject.name} Lab for Batch ${batchLab.batch}`);
        }
      }
    }
  }

  /**
   * Schedule lectures with AI-enhanced logic
   */
  private async scheduleLecturesWithAI(
    pool: UnscheduledLecture[], 
    targetYear: 'SE' | 'TE' | 'BE',
    yearClassrooms: Classroom[]
  ): Promise<void> {
    // Sort pool by AI insights
    const sortedPool = this.sortPoolByAIInsights(pool, 'theory');

    for (const day of this.DAYS) {
      for (const time of this.ALL_THEORY_SLOTS) {
        if (!this.isBatchAvailable(targetYear, undefined, day, time)) continue;
        
        const assignedClassroom = yearClassrooms.find(c => c.assignedYear === targetYear);
        if (!assignedClassroom) continue;

        // Find best fit using AI insights with strict constraint checking
        const bestFitIndex = sortedPool.findIndex(lec => {
          if (!lec || !lec.subject) return false;
          if (lec.year !== targetYear) return false;
          if (!this.isFacultyAvailable(this.getFacultyName(lec.subject), day, time)) return false;
          if (this.wasPreviousSlotSameSubject(lec.subject, targetYear, day, time)) return false;
          if (this.hasLectureAlreadyOccurredToday(lec.subject, targetYear, day)) return false;
          
          // Check if this would create consecutive sessions
          const testSlot: TimetableSlot = {
            id: `${targetYear}-${lec.subject.code}-${day}-${time}`,
            day, time, subject: lec.subject.name,
            faculty: this.getFacultyName(lec.subject), room: assignedClassroom.name,
            type: 'theory', year: targetYear, duration: this.getSlotDuration(time), semester: lec.subject.semester
          };
          
          return !this.hasConsecutiveSession(testSlot);
        });

        if (bestFitIndex > -1) {
          const [lectureToSchedule] = pool.splice(bestFitIndex, 1);
          if (lectureToSchedule && lectureToSchedule.subject) {
            const slot: TimetableSlot = {
              id: `${targetYear}-${lectureToSchedule.subject.code}-${day}-${time}`,
              day, time, subject: lectureToSchedule.subject.name,
              faculty: this.getFacultyName(lectureToSchedule.subject), room: assignedClassroom.name,
              type: 'theory', year: targetYear, duration: this.getSlotDuration(time), semester: lectureToSchedule.subject.semester
            };
            
            if (this.validateSlot(slot)) {
              this.generatedSlots.push(slot);
              console.log(`✅ Scheduled ${lectureToSchedule.subject.name} theory on ${day} ${time}`);
            }
          }
        }
      }
    }
  }

  /**
   * Sort pool based on AI insights
   */
  private sortPoolByAIInsights(pool: (UnscheduledLecture | UnscheduledLab)[], type: 'theory' | 'lab'): (UnscheduledLecture | UnscheduledLab)[] {
    if (!this.analysisResult) return pool;

    return [...pool].sort((a, b) => {
      const aSubject = a.subject.name;
      const bSubject = b.subject.name;

      // Find AI recommendations for these subjects
      const aRecommendation = this.analysisResult!.recommendedSlots.find(r => r.subject === aSubject && r.type === type);
      const bRecommendation = this.analysisResult!.recommendedSlots.find(r => r.subject === bSubject && r.type === type);

      // Sort by confidence score (higher confidence first)
      const aConfidence = aRecommendation?.confidence || 0;
      const bConfidence = bRecommendation?.confidence || 0;

      return bConfidence - aConfidence;
    });
  }

  /**
   * Validate individual slot with strict constraints
   */
  private validateSlot(slot: TimetableSlot): boolean {
    // Check for basic conflicts
    const hasConflict = this.generatedSlots.some(existing => 
      (existing.faculty === slot.faculty && existing.day === slot.day && this.doTimesOverlap(existing.time, slot.time)) ||
      (existing.room === slot.room && existing.day === slot.day && this.doTimesOverlap(existing.time, slot.time)) ||
      (existing.year === slot.year && existing.day === slot.day && this.doTimesOverlap(existing.time, slot.time) && 
       (!slot.batch || !existing.batch || existing.batch === slot.batch))
    );

    if (hasConflict) return false;

    // CRITICAL CONSTRAINT 1: Maximum 3 theory lectures per subject per week
    if (slot.type === 'theory') {
      const weeklyTheoryCount = this.generatedSlots.filter(s => 
        s.type === 'theory' && s.subject === slot.subject && s.year === slot.year
      ).length;
      if (weeklyTheoryCount >= 3) {
        console.log(`❌ Rejecting ${slot.subject} theory: already has ${weeklyTheoryCount} sessions this week`);
        return false;
      }
    }

    // CRITICAL CONSTRAINT 2: No consecutive sessions of same subject
    if (this.hasConsecutiveSession(slot)) {
      console.log(`❌ Rejecting ${slot.subject}: would create consecutive session`);
      return false;
    }

    // CRITICAL CONSTRAINT 3: Lab sessions - each subject should be scheduled once per batch per week
    if (slot.type === 'lab') {
      const weeklyLabCount = this.generatedSlots.filter(s => 
        s.type === 'lab' && s.subject === slot.subject && s.year === slot.year && s.batch === slot.batch
      ).length;
      if (weeklyLabCount >= 1) {
        console.log(`❌ Rejecting ${slot.subject} lab for ${slot.batch}: already scheduled this week`);
        return false;
      }
    }

    return true;
  }

  /**
   * Check if slot is available
   */
  private isSlotAvailable(day: string, time: string, room: string): boolean {
    return !this.generatedSlots.some(slot => 
      slot.day === day && slot.time === time && slot.room === room
    );
  }

  /**
   * Check if adding this slot would create consecutive sessions of the same subject
   */
  private hasConsecutiveSession(slot: TimetableSlot): boolean {
    const allSlots = [...this.generatedSlots, slot];
    const sameDaySlots = allSlots.filter(s => 
      s.day === slot.day && s.subject === slot.subject && s.year === slot.year
    ).sort((a, b) => this.ALL_THEORY_SLOTS.indexOf(a.time) - this.ALL_THEORY_SLOTS.indexOf(b.time));

    for (let i = 0; i < sameDaySlots.length - 1; i++) {
      const currentIndex = this.ALL_THEORY_SLOTS.indexOf(sameDaySlots[i].time);
      const nextIndex = this.ALL_THEORY_SLOTS.indexOf(sameDaySlots[i + 1].time);
      
      // Check if they are consecutive (next slot immediately follows current)
      if (nextIndex === currentIndex + 1) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Validate and optimize the generated timetable
   */
  private validateAndOptimize(): void {
    // Add AI analysis conflicts
    if (this.analysisResult) {
      this.conflicts.push(...this.analysisResult.conflicts.map(c => ({
        type: c.type === 'success' ? 'info' : c.type,
        message: c.message,
        severity: c.severity,
        affectedEntities: c.affectedEntities
      })));
    }

    // CRITICAL CONSTRAINT VALIDATION
    this.validateCriticalConstraints();
    
    // Additional validation
    this.validateFacultyWorkload();
    this.validateRoomUtilization();
  }

  /**
   * Validate critical constraints that must be enforced
   */
  private validateCriticalConstraints(): void {
    // Group slots by subject and year
    const slotsBySubject = new Map<string, TimetableSlot[]>();
    this.generatedSlots.forEach(slot => {
      const key = `${slot.subject}-${slot.year}`;
      if (!slotsBySubject.has(key)) {
        slotsBySubject.set(key, []);
      }
      slotsBySubject.get(key)!.push(slot);
    });

    // Check each subject for constraint violations
    slotsBySubject.forEach((slots, subjectKey) => {
      const theorySlots = slots.filter(s => s.type === 'theory');
      const labSlots = slots.filter(s => s.type === 'lab');

      // CONSTRAINT 1: Maximum 3 theory lectures per subject per week
      if (theorySlots.length > 3) {
        this.conflicts.push({
          type: 'error',
          message: `❌ ${subjectKey}: Has ${theorySlots.length} theory sessions (max 3 allowed)`,
          severity: 'high',
          affectedEntities: [subjectKey]
        });
      }

      // CONSTRAINT 2: Check for consecutive sessions
      const sortedTheorySlots = theorySlots.sort((a, b) => {
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        if (dayDiff !== 0) return dayDiff;
        return this.ALL_THEORY_SLOTS.indexOf(a.time) - this.ALL_THEORY_SLOTS.indexOf(b.time);
      });

      for (let i = 0; i < sortedTheorySlots.length - 1; i++) {
        const current = sortedTheorySlots[i];
        const next = sortedTheorySlots[i + 1];
        
        if (current.day === next.day) {
          const currentIndex = this.ALL_THEORY_SLOTS.indexOf(current.time);
          const nextIndex = this.ALL_THEORY_SLOTS.indexOf(next.time);
          
          if (nextIndex === currentIndex + 1) {
            this.conflicts.push({
              type: 'error',
              message: `❌ ${subjectKey}: Consecutive sessions on ${current.day} (${current.time} → ${next.time})`,
              severity: 'high',
              affectedEntities: [subjectKey, current.day]
            });
          }
        }
      }

      // CONSTRAINT 3: Lab sessions should be once per batch per week
      const labBatches = new Set(labSlots.map(s => s.batch).filter(Boolean));
      if (labSlots.length > 0 && labBatches.size < 3) {
        this.conflicts.push({
          type: 'error',
          message: `❌ ${subjectKey}: Lab scheduled for only ${labBatches.size} batches (A, B, C required)`,
          severity: 'high',
          affectedEntities: [subjectKey]
        });
      }

      // Check for duplicate lab sessions per batch
      const labBatchesCount = new Map<string, number>();
      labSlots.forEach(slot => {
        if (slot.batch) {
          labBatchesCount.set(slot.batch, (labBatchesCount.get(slot.batch) || 0) + 1);
        }
      });

      labBatchesCount.forEach((count, batch) => {
        if (count > 1) {
          this.conflicts.push({
            type: 'error',
            message: `❌ ${subjectKey}: Lab scheduled ${count} times for Batch ${batch} (max 1 allowed)`,
            severity: 'high',
            affectedEntities: [subjectKey, `Batch ${batch}`]
          });
        }
      });
    });
  }

  /**
   * Validate faculty workload
   */
  private validateFacultyWorkload(): void {
    const facultyWorkload = new Map<string, Map<string, number>>();
    
    this.generatedSlots.forEach(slot => {
      if (!facultyWorkload.has(slot.faculty)) {
        facultyWorkload.set(slot.faculty, new Map());
      }
      
      const dayMap = facultyWorkload.get(slot.faculty)!;
      const current = dayMap.get(slot.day) || 0;
      dayMap.set(slot.day, current + slot.duration);
    });

    facultyWorkload.forEach((dayMap, facultyName) => {
      const faculty = this.faculty.find(f => f.name === facultyName);
      if (!faculty) return;

      dayMap.forEach((hours, day) => {
        if (hours > faculty.maxHoursPerDay) {
          this.conflicts.push({
            type: 'warning',
            message: `${facultyName} exceeds daily hour limit (${hours}h) on ${day}`,
            severity: 'medium',
            affectedEntities: [facultyName, day]
          });
        }
      });
    });
  }

  /**
   * Validate room utilization
   */
  private validateRoomUtilization(): void {
    const roomUsage = new Map<string, number>();
    
    this.generatedSlots.forEach(slot => {
      roomUsage.set(slot.room, (roomUsage.get(slot.room) || 0) + 1);
    });

    const totalSlots = this.DAYS.length * (this.ALL_THEORY_SLOTS.length + this.LAB_SLOTS.length);
    const roomUsageValues = Array.from(roomUsage.values());
    const averageUtilization = roomUsageValues.length > 0 
      ? roomUsageValues.reduce((sum, count) => sum + count, 0) / roomUsageValues.length 
      : 0;
    
    if (averageUtilization < totalSlots * 0.6) {
      this.conflicts.push({
        type: 'info',
        message: 'Room utilization is below optimal - consider adding more sessions',
        severity: 'low',
        affectedEntities: ['Room Utilization']
      });
    }
  }

  /**
   * Calculate generation statistics
   */
  private calculateGenerationStats(targetYear: 'SE' | 'TE' | 'BE', targetSemester: number): any {
    const theorySlots = this.generatedSlots.filter(s => s.type === 'theory').length;
    const labSlots = this.generatedSlots.filter(s => s.type === 'lab').length;
    
    const facultyUtilization = new Set(this.generatedSlots.map(s => s.faculty)).size / this.faculty.length;
    const roomUtilization = new Set(this.generatedSlots.map(s => s.room)).size / (this.classrooms.length + this.labs.length);
    
    const constraintScore = this.analysisResult?.constraintScore || 0;
    
    // Generate consistency hash
    const consistencyData = {
      targetYear,
      targetSemester,
      slots: this.generatedSlots.map(s => ({
        day: s.day,
        time: s.time,
        subject: s.subject,
        faculty: s.faculty,
        room: s.room,
        type: s.type,
        year: s.year,
        batch: s.batch
      })).sort((a, b) => `${a.day}-${a.time}-${a.subject}`.localeCompare(`${b.day}-${b.time}-${b.subject}`))
    };
    
    const consistencyHash = CryptoJS.SHA256(JSON.stringify(consistencyData)).toString();

    return {
      totalSlots: this.generatedSlots.length,
      theorySlots,
      labSlots,
      facultyUtilization: Math.round(facultyUtilization * 100),
      roomUtilization: Math.round(roomUtilization * 100),
      constraintScore,
      consistencyHash
    };
  }

  /**
   * Fallback generation when AI is unavailable
   */
  private fallbackGeneration(targetYear: 'SE' | 'TE' | 'BE', targetSemester: number): AIGenerationResult {
    console.log('Using fallback generation without AI...');
    
    try {
      // Use traditional generation logic
      const relevantSubjects = this.subjects.filter(s => s.year === targetYear && s.semester === targetSemester);
      const yearClassrooms = this.classrooms.filter(c => c.assignedYear === targetYear);
      
      if (relevantSubjects.length === 0) {
        this.conflicts.push({
          type: 'error',
          message: `No subjects found for ${targetYear} Semester ${targetSemester}`,
          severity: 'high',
          affectedEntities: [`${targetYear}-${targetSemester}`]
        });
      }
      
      if (yearClassrooms.length === 0) {
        this.conflicts.push({
          type: 'error',
          message: `No classrooms assigned to ${targetYear}`,
          severity: 'high',
          affectedEntities: [targetYear]
        });
      }
      
      let unscheduledLectures = this.createLecturePool(relevantSubjects);
      let unscheduledLabs = this.createLabPool(relevantSubjects);
      
      this.scheduleLabs(unscheduledLabs);
      this.scheduleLectures(unscheduledLectures, yearClassrooms);
      this.reportUnscheduled(unscheduledLectures, unscheduledLabs);

      // Validate constraints
      this.validateCriticalConstraints();

      return {
        slots: this.generatedSlots,
        conflicts: this.conflicts,
        analysisResult: this.getFallbackAnalysisResult(),
        generationStats: this.calculateGenerationStats(targetYear, targetSemester)
      };
    } catch (error) {
      console.error('Error in fallback generation:', error);
      this.conflicts.push({
        type: 'error',
        message: `Fallback generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
        affectedEntities: ['Fallback Generator']
      });
      
      return {
        slots: [],
        conflicts: this.conflicts,
        analysisResult: this.getFallbackAnalysisResult(),
        generationStats: {
          totalSlots: 0,
          theorySlots: 0,
          labSlots: 0,
          facultyUtilization: 0,
          roomUtilization: 0,
          constraintScore: 0,
          consistencyHash: 'error'
        }
      };
    }
  }

  /**
   * Get fallback analysis result
   */
  private getFallbackAnalysisResult(): ConstraintAnalysisResult {
    return {
      isValid: this.conflicts.filter(c => c.type === 'error').length === 0,
      conflicts: this.conflicts.map(c => ({
        type: c.type,
        message: c.message,
        severity: c.severity,
        affectedEntities: c.affectedEntities
      })),
      optimizationSuggestions: [
        'Consider using AI analysis for better optimization',
        'Review faculty workload distribution',
        'Optimize room utilization'
      ],
      constraintScore: 60,
      recommendedSlots: []
    };
  }

  // Helper methods (reused from original generator)
  private createLecturePool = (subjects: Subject[]): UnscheduledLecture[] => 
    subjects.flatMap(s => Array(s.theoryHours).fill({ subject: s, year: s.year }));

  private createLabPool = (subjects: Subject[]): UnscheduledLab[] => 
    subjects.flatMap(s => 
      Array(Math.ceil(s.labHours / 2)).fill(0).flatMap(() => 
        (['A', 'B', 'C'] as const).map(batch => ({ subject: s, year: s.year, batch }))
      )
    );

  private scheduleLabs(pool: UnscheduledLab[]): void {
    for (const day of this.DAYS) {
      for (const time of this.LAB_SLOTS) {
        let availableLabRooms = this.getAvailableRooms(day, time, 'lab') as Lab[];
        const candidates = pool.filter(lab => 
          this.isBatchAvailable(lab.year, lab.batch, day, time) &&
          this.isFacultyAvailable(this.getFacultyName(lab.subject), day, time) &&
          !this.hadConsecutiveLabForFaculty(this.getFacultyName(lab.subject), day, time) &&
          !this.hadConsecutiveLabForBatch(lab.year, lab.batch, day, time)
        );

        for (const candidate of candidates) {
          if (availableLabRooms.length > 0) {
            const labRoom = availableLabRooms.shift()!;
            const slot: TimetableSlot = {
              id: `${candidate.year}-${candidate.batch}-${candidate.subject.code}-${day}-${time}`,
              day, time, subject: `${candidate.subject.name} Lab`,
              faculty: this.getFacultyName(candidate.subject), room: labRoom.name, type: 'lab',
              year: candidate.year, batch: candidate.batch, duration: this.getSlotDuration(time), semester: candidate.subject.semester
            };
            this.generatedSlots.push(slot);
            const poolIndex = pool.findIndex(p => p === candidate);
            if (poolIndex > -1) pool.splice(poolIndex, 1);
          } else {
            break;
          }
        }
      }
    }
  }

  private scheduleLectures(pool: UnscheduledLecture[], yearClassrooms: Classroom[]): void {
    for (const day of this.DAYS) {
      for (const time of this.ALL_THEORY_SLOTS) {
        for (const year of ['SE', 'TE', 'BE'] as const) {
          if (!this.isBatchAvailable(year, undefined, day, time)) continue;
          const assignedClassroom = yearClassrooms.find(c => c.assignedYear === year);
          if (!assignedClassroom) continue;

          const bestFitIndex = pool.findIndex(lec =>
            lec.year === year &&
            this.isFacultyAvailable(this.getFacultyName(lec.subject), day, time) &&
            !this.wasPreviousSlotSameSubject(lec.subject, year, day, time) &&
            !this.hasLectureAlreadyOccurredToday(lec.subject, year, day)
          );

          if (bestFitIndex > -1) {
            const [lectureToSchedule] = pool.splice(bestFitIndex, 1);
            const slot: TimetableSlot = {
              id: `${year}-${lectureToSchedule.subject.code}-${day}-${time}`,
              day, time, subject: lectureToSchedule.subject.name,
              faculty: this.getFacultyName(lectureToSchedule.subject), room: assignedClassroom.name,
              type: 'theory', year, duration: this.getSlotDuration(time), semester: lectureToSchedule.subject.semester
            };
            this.generatedSlots.push(slot);
          }
        }
      }
    }
  }

  private reportUnscheduled(lectures: UnscheduledLecture[], labs: UnscheduledLab[]): void {
    labs.forEach(lab => this.conflicts.push({ 
      type: 'error', 
      message: `Could not schedule lab for ${lab.subject.name} (${lab.year}-${lab.batch}). Not enough slots/resources.`, 
      severity: 'high', 
      affectedEntities: [lab.subject.name, `${lab.year}-${lab.batch}`] 
    }));
    
    const unscheduledCounts: { [key: string]: number } = {};
    lectures.forEach(lec => {
      const key = `${lec.subject.name} (${lec.year})`;
      unscheduledCounts[key] = (unscheduledCounts[key] || 0) + 1;
    });
    
    for (const key in unscheduledCounts) {
      this.conflicts.push({ 
        type: 'warning', 
        message: `Could not schedule ${unscheduledCounts[key]} lecture(s) for ${key}.`, 
        severity: 'medium', 
        affectedEntities: [key] 
      });
    }
  }

  private getFacultyName = (subject: Subject): string => 
    typeof subject.faculty === 'object' ? subject.faculty.name : subject.faculty;

  private getSlotDuration(time: string): number {
    // Calculate duration based on time slot
    if (time === '8:10-10:10') return 2; // 2 hours
    if (time === '10:25-12:15') return 1.75; // 1 hour 50 minutes
    if (time === '1:05-2:55') return 1.75; // 1 hour 50 minutes
    if (time === '3:05-4:55') return 1.75; // 1 hour 50 minutes
    return 1; // Default
  }

  private getBatchForLab = (subject: Subject, year: 'SE' | 'TE' | 'BE'): 'A' | 'B' | 'C' => {
    // Get all batches that have already been scheduled for this subject this week
    const existingBatches = this.generatedSlots
      .filter(s => s.subject.includes(subject.name) && s.type === 'lab' && s.year === year)
      .map(s => s.batch)
      .filter(Boolean) as ('A' | 'B' | 'C')[];
    
    // Return the first available batch (A, B, or C)
    const batches: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
    const availableBatch = batches.find(batch => !existingBatches.includes(batch));
    
    if (!availableBatch) {
      console.warn(`All batches already scheduled for ${subject.name} lab`);
      return 'A'; // Fallback
    }
    
    return availableBatch;
  };

  private isFacultyAvailable = (name: string, day: string, time: string): boolean => 
    !this.generatedSlots.some(s => s.faculty === name && s.day === day && this.doTimesOverlap(s.time, time));

  private isBatchAvailable = (year: string, batch: string | undefined, day: string, time: string): boolean => 
    !this.generatedSlots.some(s => s.year === year && (!batch || !s.batch || s.batch === batch) && s.day === day && this.doTimesOverlap(s.time, time));

  private getAvailableRooms = (day: string, time: string, type: 'lab' | 'theory'): (Lab | Classroom)[] => {
    const allRooms = type === 'lab' ? this.labs : this.classrooms;
    const bookedRooms = this.generatedSlots.filter(s => s.day === day && this.doTimesOverlap(s.time, time)).map(s => s.room);
    return allRooms.filter(room => !bookedRooms.includes(room.name));
  };

  private hadConsecutiveLabForBatch = (year: string, batch: string, day: string, time: string): boolean => {
    const timeIndex = this.LAB_SLOTS.indexOf(time);
    if (timeIndex <= 0) return false;
    const previousTime = this.LAB_SLOTS[timeIndex - 1];
    return this.generatedSlots.some(s => s.type === 'lab' && s.year === year && s.batch === batch && s.day === day && s.time === previousTime);
  };

  private hadConsecutiveLabForFaculty = (name: string, day: string, time: string): boolean => {
    const timeIndex = this.LAB_SLOTS.indexOf(time);
    if (timeIndex <= 0) return false;
    const previousTime = this.LAB_SLOTS[timeIndex - 1];
    return this.generatedSlots.some(s => s.type === 'lab' && s.faculty === name && s.day === day && s.time === previousTime);
  };

  private wasPreviousSlotSameSubject = (subject: Subject, year: string, day: string, time: string): boolean => {
    const currentIndex = this.ALL_THEORY_SLOTS.indexOf(time);
    if (currentIndex <= 0) return false; 
    const previousTime = this.ALL_THEORY_SLOTS[currentIndex - 1];
    return this.generatedSlots.some(s => s.year === year && s.day === day && s.subject === subject.name && s.time === previousTime);
  };

  private hasLectureAlreadyOccurredToday = (subject: Subject, year: string, day: string): boolean => {
    return this.generatedSlots.some(s =>
      s.type === 'theory' && s.day === day &&
      s.year === year && s.subject === subject.name
    );
  };

  private doTimesOverlap = (time1: string, time2: string): boolean => {
    const [start1, end1] = time1.split('-').map(t => parseInt(t.replace(':', ''), 10));
    const [start2, end2] = time2.split('-').map(t => parseInt(t.replace(':', ''), 10));
    return Math.max(start1, start2) < Math.min(end1, end2);
  };
}
