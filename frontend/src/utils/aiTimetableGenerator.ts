import { Subject, Faculty, Classroom, Lab, TimetableSlot, TimetableConstraints, Conflict } from '../types/timetable';
import { geminiAnalyzer, ConstraintAnalysisResult, TimetableContext } from '../services/geminiService';
import CryptoJS from 'crypto-js';

// Helper types
type UnscheduledLecture = { subject: Subject; year: 'SE' | 'TE' | 'BE'; }
type UnscheduledLab = { subject: Subject; year: 'SE' | 'TE' | 'BE'; batch: 'A' | 'B' | 'C'; }

// Extend TimetableSlot type (assuming you can modify this in your types/timetable file)
// If not, you might need to handle this differently or omit the flag.
export interface ExtendedTimetableSlot extends TimetableSlot {
  isFillIn?: boolean; // Flag for slots added in the second pass
}

export interface AIGenerationResult {
  slots: ExtendedTimetableSlot[]; // Use the extended type
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
  private generatedSlots: ExtendedTimetableSlot[] = []; // Use the extended type
  private conflicts: Conflict[] = [];
  private analysisResult: ConstraintAnalysisResult | null = null;

  private readonly DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  private readonly MORNING_THEORY_SLOTS = ['8:10-9:10', '9:10-10:10', '10:25-11:20', '11:20-12:15', '1:05-2:00', '2:00-2:55'];
  private readonly AFTERNOON_THEORY_SLOTS = ['10:25-11:20', '11:20-12:15', '1:05-2:00', '2:00-2:55', '3:05-4:00', '4:00-4:55'];
  private readonly MORNING_LAB_SLOTS = ['8:10-10:10', '10:25-12:15', '1:05-2:55'];
  private readonly AFTERNOON_LAB_SLOTS = ['10:25-12:15', '1:05-2:55', '3:05-4:55'];
  private readonly ALL_THEORY_SLOTS = ['8:10-9:10', '9:10-10:10', '10:25-11:20', '11:20-12:15', '1:05-2:00', '2:00-2:55', '3:05-4:00', '4:00-4:55'];

  constructor(subjects: Subject[], faculty: Faculty[], classrooms: Classroom[], labs: Lab[], constraints: TimetableConstraints) {
    this.subjects = subjects;
    this.faculty = faculty;
    this.classrooms = classrooms;
    this.labs = labs;
    this.constraints = constraints;
  }

  public async generateTimetable(targetYear: 'SE' | 'TE' | 'BE', targetSemester: number): Promise<AIGenerationResult> {
    this.generatedSlots = [];
    this.conflicts = [];

    try {
      // Step 1: AI Constraint Analysis (if needed)
      const context: TimetableContext = { subjects: this.subjects, faculty: this.faculty, classrooms: this.classrooms, labs: this.labs, constraints: this.constraints, existingSlots: this.generatedSlots, targetYear, targetSemester };
      this.analysisResult = await geminiAnalyzer.analyzeConstraints(context);

      // Step 2: Generate slots
      await this.generateSlotsWithAI(targetYear, targetSemester);

      // Step 3: Validate and optimize
      this.validateAndOptimize();

      // Step 4: Calculate statistics
      const stats = this.calculateGenerationStats(targetYear, targetSemester);

      return { slots: this.generatedSlots, conflicts: this.conflicts, analysisResult: this.analysisResult, generationStats: stats };
    } catch (error) {
      console.error('Error in AI timetable generation:', error);
      console.log('Falling back to traditional generation...');
      return this.fallbackGeneration(targetYear, targetSemester);
    }
  }

  private async generateSlotsWithAI(targetYear: 'SE' | 'TE' | 'BE', targetSemester: number): Promise<void> {
    if (!this.analysisResult) throw new Error('AI analysis not available');

    const relevantSubjects = this.subjects.filter(s => s.year === targetYear && s.semester === targetSemester);
    const yearClassrooms = this.classrooms.filter(c => c.assignedYear === targetYear);

    // Use high-confidence AI recommendations first
    for (const recommendation of this.analysisResult.recommendedSlots) {
      if (recommendation.confidence >= 70) {
        const subject = relevantSubjects.find(s => s.name === recommendation.subject);
        if (subject && this.isSlotAvailable(recommendation.day, recommendation.time, recommendation.room)) {
          const slot = this.createSlotFromRecommendation(recommendation, subject, targetYear, targetSemester);
          if (slot && this.validateSlot(slot)) this.generatedSlots.push(slot);
        }
      }
    }

    // Prepare pools of remaining sessions
    const unscheduledLectures = this.createLecturePool(relevantSubjects);
    const unscheduledLabs = this.createLabPool(relevantSubjects);

    // --- Scheduling Passes ---
    // 1. Schedule Labs Concurrently (AI enhanced)
    await this.scheduleLabsConcurrently(unscheduledLabs, targetYear, 'ai');

    // 2. Schedule Lectures (AI enhanced)
    await this.scheduleLecturesWithAI(unscheduledLectures, targetYear, yearClassrooms);

    // 3. **NEW:** Fill remaining empty theory slots with unscheduled lectures
    await this.fillRemainingLectureSlots(unscheduledLectures, targetYear, yearClassrooms);

    // Report any remaining unscheduled items
    this.reportUnscheduled(unscheduledLectures, unscheduledLabs);
  }

  // --- Lab Scheduling (Concurrent) ---
  private async scheduleLabsConcurrently(
    pool: UnscheduledLab[],
    targetYear: 'SE' | 'TE' | 'BE',
    mode: 'ai' | 'fallback' // Mode affects sorting/logging
  ): Promise<void> {
    const labsForTargetYear = pool.filter(lab => lab.year === targetYear);
    console.log(`Attempting to schedule ${labsForTargetYear.length} labs concurrently for ${targetYear}...`);

    const labSlots = this.getLabSlotsForYear(targetYear);
    
    for (const day of this.DAYS) {
      for (const time of labSlots) {
        // Find all rooms available at this specific time slot
        const availableLabRooms = this.getAvailableRooms(day, time, 'lab') as Lab[];
        let scheduledInThisSlot = 0;

        if (availableLabRooms.length === 0) continue;

        // Find candidate labs from the pool for this year
        let candidates = labsForTargetYear.filter(lab =>
          this.isBatchAvailable(lab.year, lab.batch, day, time) &&
          this.isFacultyAvailable(this.getFacultyName(lab.subject), day, time) &&
          !this.hasLabAlreadyOccurredTodayForBatch(lab.year, lab.batch, day) &&
          !this.hadConsecutiveLabForFaculty(this.getFacultyName(lab.subject), day, time) &&
          !this.hadConsecutiveLabForBatch(lab.year, lab.batch, day, time)
        );

        // Optional: Sort candidates if in AI mode
        if (mode === 'ai') {
          candidates = this.sortPoolByAIInsights(candidates, 'lab') as UnscheduledLab[];
        }

        const facultyScheduledThisSlot = new Set<string>();
        const batchesScheduledThisSlot = new Set<string>(); // Batch key: "SE-A"

        for (const candidate of candidates) {
          if (scheduledInThisSlot >= availableLabRooms.length) break; // No more rooms

          const facultyName = this.getFacultyName(candidate.subject);
          const batchKey = `${candidate.year}-${candidate.batch}`;

          // Check if faculty or batch is already scheduled *in this concurrent group*
          if (facultyScheduledThisSlot.has(facultyName) || batchesScheduledThisSlot.has(batchKey)) {
            continue; // Conflict within this concurrent slot
          }

          const labRoom = availableLabRooms[scheduledInThisSlot];
          const slot: ExtendedTimetableSlot = {
            id: `${candidate.year}-${candidate.batch}-${candidate.subject.code}-${day}-${time}-${labRoom.name}`,
            day, time, subject: `${candidate.subject.name} Lab`,
            faculty: facultyName, room: labRoom.name, type: 'lab',
            year: candidate.year, batch: candidate.batch, duration: this.getSlotDuration(time), semester: candidate.subject.semester
          };

          if (this.validateSlot(slot)) { // validateSlot handles weekly limit
            this.generatedSlots.push(slot);
            facultyScheduledThisSlot.add(facultyName);
            batchesScheduledThisSlot.add(batchKey);
            scheduledInThisSlot++;

            // Remove from pools
            const poolIndex = labsForTargetYear.findIndex(p => p === candidate);
            if (poolIndex > -1) labsForTargetYear.splice(poolIndex, 1);
            const originalPoolIndex = pool.findIndex(p => p === candidate);
            if (originalPoolIndex > -1) pool.splice(originalPoolIndex, 1);

            console.log(`✅ Concurrent Lab: ${candidate.subject.name} (${candidate.batch}) in ${labRoom.name} on ${day} ${time}`);
          }
        }
      }
    }
  }

  // --- Lecture Scheduling (AI Pass) ---
  private async scheduleLecturesWithAI(pool: UnscheduledLecture[], targetYear: 'SE' | 'TE' | 'BE', yearClassrooms: Classroom[]): Promise<void> {
    const sortedPool = this.sortPoolByAIInsights(pool, 'theory') as UnscheduledLecture[];
    const batchType = this.getBatchTypeForYear(targetYear);
    const relevantTheorySlots = (batchType === 'Morning') ? this.MORNING_THEORY_SLOTS : this.AFTERNOON_THEORY_SLOTS;
    const assignedClassroom = yearClassrooms.find(c => c.assignedYear === targetYear);

    if (!assignedClassroom) {
      console.warn(`No classroom for ${targetYear} in scheduleLecturesWithAI.`);
      return;
    }

    console.log(`Scheduling lectures (AI Pass) for ${targetYear} (${batchType})...`);

    for (const day of this.DAYS) {
      for (const time of relevantTheorySlots) {
        // Is the slot physically available (year not busy, classroom not busy)?
        if (this.isYearOccupied(targetYear, day, time) || this.isRoomOccupied(assignedClassroom.name, day, time)) continue;

        // Find best lecture based on constraints (faculty available, no consecutive)
        const bestFitIndex = sortedPool.findIndex(lec => {
          if (!lec || !lec.subject || lec.year !== targetYear) return false;
          const facultyName = this.getFacultyName(lec.subject);
          if (!this.isFacultyAvailable(facultyName, day, time)) return false;

          // Test for consecutive constraint
          const testSlot: ExtendedTimetableSlot = { id: `test-${targetYear}-${lec.subject.code}-${day}-${time}`, day, time, subject: lec.subject.name, faculty: facultyName, room: assignedClassroom.name, type: 'theory', year: targetYear, duration: this.getSlotDuration(time), semester: lec.subject.semester };
          if (this.hasConsecutiveSession(testSlot)) return false;

          return true;
        });

        if (bestFitIndex > -1) {
          const [lectureToSchedule] = sortedPool.splice(bestFitIndex, 1); // Remove from sorted pool
          // Also remove from original pool
          const originalPoolIndex = pool.findIndex(p => p === lectureToSchedule);
          if (originalPoolIndex > -1) pool.splice(originalPoolIndex, 1);


          if (lectureToSchedule?.subject) {
            const slot: ExtendedTimetableSlot = {
              id: `${targetYear}-${lectureToSchedule.subject.code}-${day}-${time}`,
              day, time, subject: lectureToSchedule.subject.name,
              faculty: this.getFacultyName(lectureToSchedule.subject), room: assignedClassroom.name,
              type: 'theory', year: targetYear, duration: this.getSlotDuration(time), semester: lectureToSchedule.subject.semester
            };
            if (this.validateSlot(slot)) { // validateSlot checks weekly theory limit
              this.generatedSlots.push(slot);
              console.log(`✅ Scheduled ${lectureToSchedule.subject.name} theory on ${day} ${time}`);
            } else {
              console.warn(`Validation failed for ${lectureToSchedule.subject.name} at ${day} ${time}, putting back.`);
              pool.push(lectureToSchedule); // Add back if validation fails
              sortedPool.push(lectureToSchedule); // Add back to sorted pool too
            }
          }
        }
      }
    }
  }


  // --- **NEW:** Lecture Scheduling (Fill Empty Slots Pass) ---
  private async fillRemainingLectureSlots(
    pool: UnscheduledLecture[],
    targetYear: 'SE' | 'TE' | 'BE',
    yearClassrooms: Classroom[]
  ): Promise<void> {
    if (pool.length === 0) return;

    console.log(`Attempting to fill remaining ${pool.length} lectures for ${targetYear} in empty slots...`);

    const assignedClassroom = yearClassrooms.find(c => c.assignedYear === targetYear);
    if (!assignedClassroom) {
      console.warn(`No assigned classroom for ${targetYear}, cannot fill remaining lectures.`);
      return;
    }

    // Use ALL slots this time, including potential lab slots if they are empty
    const potentialSlots = this.ALL_THEORY_SLOTS; // Could also check LAB_SLOTS interpreted as theory

    for (const day of this.DAYS) {
      for (const time of potentialSlots) {
        if (pool.length === 0) return; // Stop if all lectures are scheduled

        // Check if the YEAR and CLASSROOM are free at this time
        if (!this.isYearOccupied(targetYear, day, time) && !this.isRoomOccupied(assignedClassroom.name, day, time)) {
          console.log(`Potential empty slot for fill-in found for ${targetYear} on ${day} ${time}`);

          // Find the first remaining lecture whose faculty is available and doesn't cause consecutive issues
          const bestFitIndex = pool.findIndex(lec => {
            if (!lec || !lec.subject || lec.year !== targetYear) return false;
            const facultyName = this.getFacultyName(lec.subject);
            if (!this.isFacultyAvailable(facultyName, day, time)) return false;

            const testSlot: ExtendedTimetableSlot = { id: `fill-test-${targetYear}-${lec.subject.code}-${day}-${time}`, day, time, subject: lec.subject.name, faculty: facultyName, room: assignedClassroom.name, type: 'theory', year: targetYear, duration: this.getSlotDuration(time), semester: lec.subject.semester };
            if (this.hasConsecutiveSession(testSlot)) {
              console.log(`Skipping ${lec.subject.name} for fill-in at ${day} ${time}: Would be consecutive.`);
              return false;
            }

            // Optional: Check if adding this exceeds faculty max hours, log warning if needed
            // const faculty = this.faculty.find(f => f.name === facultyName);
            // const currentHours = this.calculateFacultyHoursForDay(facultyName, day);
            // if (faculty && (currentHours + this.getSlotDuration(time) > faculty.maxHoursPerDay)) {
            //     console.warn(`⚠️ Scheduling ${lec.subject.name} on ${day} ${time} will exceed ${facultyName}'s max hours.`);
            // }

            return true;
          });

          if (bestFitIndex > -1) {
            const [lectureToSchedule] = pool.splice(bestFitIndex, 1);
            if (lectureToSchedule?.subject) {
              const slot: ExtendedTimetableSlot = {
                id: `fill-${targetYear}-${lectureToSchedule.subject.code}-${day}-${time}`,
                day, time, subject: lectureToSchedule.subject.name,
                faculty: this.getFacultyName(lectureToSchedule.subject), room: assignedClassroom.name,
                type: 'theory', year: targetYear, duration: this.getSlotDuration(time), semester: lectureToSchedule.subject.semester,
                isFillIn: true // Mark as fill-in
              };

              // Use a slightly more lenient validation for fill-in? For now, use standard.
              if (this.validateSlot(slot)) {
                this.generatedSlots.push(slot);
                console.log(`✅ Filled empty slot: Scheduled ${lectureToSchedule.subject.name} theory on ${day} ${time}`);
              } else {
                console.warn(`Fill-in slot validation failed for ${lectureToSchedule.subject.name} on ${day} ${time}. Putting back.`);
                pool.splice(bestFitIndex, 0, lectureToSchedule); // Add back at the same position
              }
            }
          } else {
            // console.log(`Slot ${day} ${time} is free for ${targetYear}, but no suitable remaining lecture found.`);
          }
        }
      }
    }
  }


  // --- Fallback Generation ---
  private fallbackGeneration(targetYear: 'SE' | 'TE' | 'BE', targetSemester: number): AIGenerationResult {
    console.log('Using fallback generation without AI...');
    try {
      const relevantSubjects = this.subjects.filter(s => s.year === targetYear && s.semester === targetSemester);
      const yearClassrooms = this.classrooms.filter(c => c.assignedYear === targetYear);

      if (relevantSubjects.length === 0 || yearClassrooms.length === 0) {
        // Add conflicts and return early if basic data is missing
        if (relevantSubjects.length === 0) this.conflicts.push({ type: 'error', message: `No subjects for ${targetYear} Sem ${targetSemester}`, severity: 'high', affectedEntities: [] });
        if (yearClassrooms.length === 0) this.conflicts.push({ type: 'error', message: `No classrooms for ${targetYear}`, severity: 'high', affectedEntities: [] });
        return this.createEmptyResult(targetYear, targetSemester, 'Fallback pre-check failed');
      }

      let unscheduledLectures = this.createLecturePool(relevantSubjects);
      let unscheduledLabs = this.createLabPool(relevantSubjects);

      // Use concurrent lab scheduling
      this.scheduleLabsConcurrently(unscheduledLabs, targetYear, 'fallback');
      // Use standard lecture scheduling
      this.scheduleLecturesFallback(unscheduledLectures, targetYear, yearClassrooms);
      // Use fill-in lecture scheduling
      this.fillRemainingLectureSlots(unscheduledLectures, targetYear, yearClassrooms);

      this.reportUnscheduled(unscheduledLectures, unscheduledLabs);
      this.validateCriticalConstraints(); // Run validation

      return { slots: this.generatedSlots, conflicts: this.conflicts, analysisResult: this.getFallbackAnalysisResult(), generationStats: this.calculateGenerationStats(targetYear, targetSemester) };
    } catch (error) {
      console.error('Error in fallback generation:', error);
      this.conflicts.push({ type: 'error', message: `Fallback failed: ${error instanceof Error ? error.message : 'Unknown'}`, severity: 'high', affectedEntities: [] });
      return this.createEmptyResult(targetYear, targetSemester, 'Fallback exception');
    }
  }

  // Fallback lecture scheduling (similar to AI version but without sorting)
  private scheduleLecturesFallback(pool: UnscheduledLecture[], targetYear: 'SE' | 'TE' | 'BE', yearClassrooms: Classroom[]): void {
    const batchType = this.getBatchTypeForYear(targetYear);
    const relevantTheorySlots = (batchType === 'Morning') ? this.MORNING_THEORY_SLOTS : this.AFTERNOON_THEORY_SLOTS;
    const assignedClassroom = yearClassrooms.find(c => c.assignedYear === targetYear);

    if (!assignedClassroom) return;

    console.log(`Scheduling lectures (Fallback) for ${targetYear} (${batchType})...`);

    for (const day of this.DAYS) {
      for (const time of relevantTheorySlots) {
        if (this.isYearOccupied(targetYear, day, time) || this.isRoomOccupied(assignedClassroom.name, day, time)) continue;

        const bestFitIndex = pool.findIndex(lec => {
          if (!lec || !lec.subject || lec.year !== targetYear) return false;
          const facultyName = this.getFacultyName(lec.subject);
          if (!this.isFacultyAvailable(facultyName, day, time)) return false;

          const testSlot: ExtendedTimetableSlot = { id: `fb-test-${targetYear}-${lec.subject.code}-${day}-${time}`, day, time, subject: lec.subject.name, faculty: facultyName, room: assignedClassroom.name, type: 'theory', year: targetYear, duration: this.getSlotDuration(time), semester: lec.subject.semester };
          if (this.hasConsecutiveSession(testSlot)) return false;
          return true;
        });

        if (bestFitIndex > -1) {
          const [lectureToSchedule] = pool.splice(bestFitIndex, 1);
          if (lectureToSchedule?.subject) {
            const slot: ExtendedTimetableSlot = {
              id: `fb-${targetYear}-${lectureToSchedule.subject.code}-${day}-${time}`,
              day, time, subject: lectureToSchedule.subject.name,
              faculty: this.getFacultyName(lectureToSchedule.subject), room: assignedClassroom.name,
              type: 'theory', year: targetYear, duration: this.getSlotDuration(time), semester: lectureToSchedule.subject.semester
            };
            if (this.validateSlot(slot)) {
              this.generatedSlots.push(slot);
              console.log(`✅ Fallback Scheduled ${lectureToSchedule.subject.name} theory on ${day} ${time}`);
            } else {
              console.warn(`Fallback validation failed for ${lectureToSchedule.subject.name} at ${day} ${time}, putting back.`);
              pool.splice(bestFitIndex, 0, lectureToSchedule); // Add back
            }
          }
        }
      }
    }
  }


  // --- Helper Methods (Validation, Checks, etc.) ---

  // Modified validateSlot to check weekly theory count
  private validateSlot(slot: ExtendedTimetableSlot): boolean {
    // Basic conflict checks (faculty/room/batch double booking)
    const basicConflict = this.generatedSlots.some(existing =>
      (existing.faculty === slot.faculty && existing.day === slot.day && this.doTimesOverlap(existing.time, slot.time)) ||
      (existing.room === slot.room && existing.day === slot.day && this.doTimesOverlap(existing.time, slot.time)) ||
      (existing.year === slot.year && existing.day === slot.day && this.doTimesOverlap(existing.time, slot.time) &&
        (!slot.batch || !existing.batch || existing.batch === slot.batch)) // Batch conflict only if batches exist and match
    );
    if (basicConflict) {
      console.log(`❌ Rejecting ${slot.subject} ${slot.batch || ''} on ${slot.day} ${slot.time}: Basic Conflict`);
      return false;
    }

    // Check 1: No consecutive theory sessions of the same subject
    if (slot.type === 'theory' && this.hasConsecutiveSession(slot)) {
      console.log(`❌ Rejecting ${slot.subject} theory on ${slot.day} ${slot.time}: Would be consecutive`);
      return false;
    }

    // Check 2: Max theory lectures per subject per week
    if (slot.type === 'theory') {
      const weeklyTheoryCount = this.generatedSlots.filter(s =>
        s.type === 'theory' && s.subject === slot.subject && s.year === slot.year
      ).length;
      const subjectDef = this.subjects.find(s => s.name === slot.subject && s.year === slot.year);
      const maxAllowed = subjectDef?.theoryHours || 3; // Default to 3 if subject not found
      if (weeklyTheoryCount >= maxAllowed) {
        console.log(`❌ Rejecting ${slot.subject} theory on ${slot.day} ${slot.time}: Already has ${weeklyTheoryCount}/${maxAllowed} sessions this week`);
        return false;
      }
    }

    // Check 3: Lab sessions - max once per batch per week
    if (slot.type === 'lab') {
      const weeklyLabCount = this.generatedSlots.filter(s =>
        s.type === 'lab' && s.subject === slot.subject && s.year === slot.year && s.batch === slot.batch
      ).length;
      if (weeklyLabCount >= 1) {
        console.log(`❌ Rejecting ${slot.subject} lab for ${slot.batch} on ${slot.day} ${slot.time}: Already scheduled this week`);
        return false;
      }
    }

    return true; // Passed all checks
  }


  private isYearOccupied = (year: string, day: string, time: string): boolean => {
    // Checks if *any* theory class (no batch) for the year is scheduled
    return this.generatedSlots.some(s => s.year === year && !s.batch && s.day === day && this.doTimesOverlap(s.time, time));
  };

  private isRoomOccupied = (roomName: string, day: string, time: string): boolean => {
    return this.generatedSlots.some(s => s.room === roomName && s.day === day && this.doTimesOverlap(s.time, time));
  };

  // ... (Keep other helpers: hasConsecutiveSession, isSlotAvailable, validateAndOptimize, validateCriticalConstraints, validateFacultyWorkload, validateRoomUtilization, calculateGenerationStats, getFallbackAnalysisResult, createLecturePool, createLabPool, reportUnscheduled, getFacultyName, getSlotDuration, getBatchTypeForYear, getBatchForLab, isFacultyAvailable, isBatchAvailable, getAvailableRooms, hadConsecutiveLabForBatch, hadConsecutiveLabForFaculty, wasPreviousSlotSameSubject, hasLabAlreadyOccurredTodayForBatch, doTimesOverlap) ...

  // Need to add calculateFacultyHoursForDay if using the warning in fillRemainingLectureSlots
  private calculateFacultyHoursForDay(facultyName: string, day: string): number {
    return this.generatedSlots
      .filter(slot => slot.faculty === facultyName && slot.day === day)
      .reduce((total, slot) => total + slot.duration, 0);
  }

  // Helper to create an empty result structure on fatal errors
  private createEmptyResult(_targetYear: 'SE' | 'TE' | 'BE', _targetSemester: number, reason: string): AIGenerationResult {
    console.error(`Creating empty result: ${reason}`);
    return {
      slots: [],
      conflicts: this.conflicts,
      analysisResult: this.analysisResult || this.getFallbackAnalysisResult(), // Use fallback if AI didn't run
      generationStats: {
        totalSlots: 0, theorySlots: 0, labSlots: 0, facultyUtilization: 0,
        roomUtilization: 0, constraintScore: 0, consistencyHash: `error-${Date.now()}`
      }
    };
  }

  // --- Existing Helper Methods (Ensure they are present) ---
  // Make sure all the methods listed below are still in your class, 
  // as they are used by the new/modified logic.

  private createSlotFromRecommendation(recommendation: any, subject: Subject, targetYear: 'SE' | 'TE' | 'BE', targetSemester: number): ExtendedTimetableSlot | null {
    const facultyName = this.getFacultyName(subject);
    const duration = this.getSlotDuration(recommendation.time); // Use duration based on time
    const batch = recommendation.type === 'lab' ? recommendation.batch || this.getBatchForLab(subject, targetYear) : undefined; // Use recommendation batch if provided
    const type = (this.MORNING_LAB_SLOTS.includes(recommendation.time) || this.AFTERNOON_LAB_SLOTS.includes(recommendation.time)) ? 'lab' : 'theory'; // Infer type from time slot list

    return {
      id: `${targetYear}-${type === 'lab' ? batch : ''}-${subject.code}-${recommendation.day}-${recommendation.time}`,
      day: recommendation.day,
      time: recommendation.time,
      subject: type === 'lab' ? `${subject.name} Lab` : subject.name,
      faculty: facultyName,
      room: recommendation.room,
      type: type,
      year: targetYear,
      batch,
      duration,
      semester: targetSemester
    };
  }


  private sortPoolByAIInsights(pool: (UnscheduledLecture | UnscheduledLab)[], type: 'theory' | 'lab'): (UnscheduledLecture | UnscheduledLab)[] {
    if (!this.analysisResult) return pool;

    return [...pool].sort((a, b) => {
      const aSubject = a.subject.name;
      const bSubject = b.subject.name;
      const aBatch = (a as UnscheduledLab).batch; // Get batch if it's a lab
      const bBatch = (b as UnscheduledLab).batch;

      const aRecommendation = this.analysisResult!.recommendedSlots.find(r => r.subject === aSubject && r.type === type && (type === 'theory' || r.batch === aBatch));
      const bRecommendation = this.analysisResult!.recommendedSlots.find(r => r.subject === bSubject && r.type === type && (type === 'theory' || r.batch === bBatch));

      const aConfidence = aRecommendation?.confidence || 0;
      const bConfidence = bRecommendation?.confidence || 0;

      return bConfidence - aConfidence; // Higher confidence first
    });
  }

  private isSlotAvailable(day: string, time: string, room: string): boolean {
    return !this.generatedSlots.some(slot => slot.day === day && this.doTimesOverlap(slot.time, time) && slot.room === room);
  }

  private hasConsecutiveSession(slot: ExtendedTimetableSlot): boolean {
    if (slot.type !== 'theory') return false;

    // Temporarily add the slot to check
    const potentialSlots = [...this.generatedSlots, slot];

    const sameDaySlots = potentialSlots.filter(s =>
      s.day === slot.day && s.subject === slot.subject && s.year === slot.year && s.type === 'theory'
    ).sort((a, b) => this.ALL_THEORY_SLOTS.indexOf(a.time) - this.ALL_THEORY_SLOTS.indexOf(b.time));

    for (let i = 0; i < sameDaySlots.length - 1; i++) {
      const currentIndex = this.ALL_THEORY_SLOTS.indexOf(sameDaySlots[i].time);
      const nextIndex = this.ALL_THEORY_SLOTS.indexOf(sameDaySlots[i + 1].time);
      if (currentIndex !== -1 && nextIndex === currentIndex + 1) { // Ensure index is found
        return true;
      }
    }
    return false;
  }

  private validateAndOptimize(): void {
    if (this.analysisResult) {
      this.conflicts.push(...this.analysisResult.conflicts.map(c => ({
        type: c.type, message: c.message, severity: c.severity, affectedEntities: c.affectedEntities
      })));
    }
    this.validateCriticalConstraints();
    this.validateFacultyWorkload();
    this.validateRoomUtilization();
  }

  private validateCriticalConstraints(): void {
    // (Keep your existing implementation - it checks weekly limits and final consecutive state)
    // Group slots by subject and year
    const slotsBySubject = new Map<string, ExtendedTimetableSlot[]>();
    this.generatedSlots.forEach(slot => {
      const key = `${slot.subject}-${slot.year}${slot.batch ? '-' + slot.batch : ''}`; // More specific key for labs
      if (!slotsBySubject.has(key)) slotsBySubject.set(key, []);
      slotsBySubject.get(key)!.push(slot);
    });

    slotsBySubject.forEach((slots, subjectKey) => {
      const theorySlots = slots.filter(s => s.type === 'theory');
      const labSlots = slots.filter(s => s.type === 'lab');
      const slot = slots[0]; // Get a representative slot

      // Find original subject definition
      const originalSubject = this.subjects.find(s =>
        (s.name === slot.subject || `${s.name} Lab` === slot.subject) && s.year === slot.year
      );

      // CONSTRAINT 1: Check Theory Hours Scheduled vs Required
      const expectedTheoryHours = originalSubject?.theoryHours || 0;
      if (expectedTheoryHours > 0 && theorySlots.length < expectedTheoryHours) {
        this.conflicts.push({ type: 'warning', message: `⚠️ ${subjectKey}: Only ${theorySlots.length}/${expectedTheoryHours} theory sessions scheduled`, severity: 'medium', affectedEntities: [subjectKey] });
      }
      if (theorySlots.length > expectedTheoryHours) {
        this.conflicts.push({ type: 'error', message: `❌ ${subjectKey}: Has ${theorySlots.length} theory sessions (max ${expectedTheoryHours} allowed)`, severity: 'high', affectedEntities: [subjectKey] });
      }


      // CONSTRAINT 2: Check for consecutive sessions (final check)
      const sortedTheorySlots = theorySlots.sort((a, b) => {
        const dayOrder = this.DAYS;
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
          if (currentIndex !== -1 && nextIndex === currentIndex + 1) {
            this.conflicts.push({ type: 'error', message: `❌ ${subjectKey}: Consecutive sessions on ${current.day} (${current.time} → ${next.time})`, severity: 'high', affectedEntities: [subjectKey, current.day] });
          }
        }
      }

      // CONSTRAINT 3: Check Lab Sessions per Batch per Week
      if (labSlots.length > 0) {
        const expectedLabSessions = Math.ceil((originalSubject?.labHours || 0) / 2); // e.g., 2 labHours = 1 session
        if (expectedLabSessions > 0 && labSlots.length < expectedLabSessions) {
          this.conflicts.push({ type: 'warning', message: `⚠️ ${subjectKey}: Only ${labSlots.length}/${expectedLabSessions} lab sessions scheduled`, severity: 'medium', affectedEntities: [subjectKey] });
        }
        if (labSlots.length > expectedLabSessions) {
          this.conflicts.push({ type: 'error', message: `❌ ${subjectKey}: Has ${labSlots.length} lab sessions (max ${expectedLabSessions} allowed)`, severity: 'high', affectedEntities: [subjectKey] });
        }
        // Check if *each required* batch (A, B, C) got scheduled *at least once* if expected > 0
        if (expectedLabSessions > 0) {
          const scheduledBatches = new Set(labSlots.map(l => l.batch).filter(Boolean) as ('A' | 'B' | 'C')[]);
          const requiredBatches: ('A' | 'B' | 'C')[] = ['A', 'B', 'C']; // Assuming all 3 are always required if labs exist
          requiredBatches.forEach(batch => {
            if (!scheduledBatches.has(batch)) {
              this.conflicts.push({ type: 'error', message: `❌ ${subjectKey}: Lab session missing for Batch ${batch}`, severity: 'high', affectedEntities: [subjectKey, `Batch ${batch}`] });
            }
          })
        }
      }
    });
  }

  private validateFacultyWorkload(): void {
    const facultyWorkload = new Map<string, Map<string, number>>();
    this.generatedSlots.forEach(slot => {
      if (!facultyWorkload.has(slot.faculty)) facultyWorkload.set(slot.faculty, new Map());
      const dayMap = facultyWorkload.get(slot.faculty)!;
      dayMap.set(slot.day, (dayMap.get(slot.day) || 0) + slot.duration);
    });

    facultyWorkload.forEach((dayMap, facultyName) => {
      const faculty = this.faculty.find(f => f.name === facultyName);
      if (!faculty) return;
      dayMap.forEach((hours, day) => {
        if (hours > faculty.maxHoursPerDay) {
          this.conflicts.push({ type: 'warning', message: `Faculty Load: ${facultyName} exceeds daily limit (${hours}h/${faculty.maxHoursPerDay}h) on ${day}`, severity: 'medium', affectedEntities: [facultyName, day] });
        }
      });
    });
  }

  private validateRoomUtilization(): void {
    const roomUsage = new Map<string, number>();
    this.generatedSlots.forEach(slot => {
      roomUsage.set(slot.room, (roomUsage.get(slot.room) || 0) + 1);
    });

    const totalRooms = this.classrooms.length + this.labs.length;
    const usedRooms = roomUsage.size;
    const utilizationRate = totalRooms > 0 ? (usedRooms / totalRooms) * 100 : 0;

    if (utilizationRate < 50) {
      this.conflicts.push({
        type: 'warning',
        message: `Low room utilization: ${utilizationRate.toFixed(1)}% (${usedRooms}/${totalRooms} rooms used)`,
        severity: 'medium',
        affectedEntities: ['Room Utilization']
      });
    }

    // Check for overutilized rooms
    roomUsage.forEach((usage, roomName) => {
      if (usage > 20) { // More than 20 slots per week
        this.conflicts.push({
          type: 'warning',
          message: `High usage for ${roomName}: ${usage} slots per week`,
          severity: 'medium',
          affectedEntities: [roomName]
        });
      }
    });
  }

  private calculateGenerationStats(targetYear: 'SE' | 'TE' | 'BE', targetSemester: number): any {
    // (Keep your existing implementation - ensure it uses this.generatedSlots)
    const theorySlots = this.generatedSlots.filter(s => s.type === 'theory').length;
    const labSlots = this.generatedSlots.filter(s => s.type === 'lab').length;
    const facultyInvolved = new Set(this.generatedSlots.map(s => s.faculty));
    const roomsUsed = new Set(this.generatedSlots.map(s => s.room));

    const facultyUtilization = this.faculty.length > 0 ? facultyInvolved.size / this.faculty.length : 0;
    const totalRooms = this.classrooms.length + this.labs.length;
    const roomUtilization = totalRooms > 0 ? roomsUsed.size / totalRooms : 0;
    const constraintScore = this.analysisResult?.constraintScore || (this.conflicts.some(c => c.type === 'error') ? 50 : 75); // Estimate if no AI

    const consistencyData = { targetYear, targetSemester, slots: this.generatedSlots.map(s => ({ day: s.day, time: s.time, subject: s.subject, faculty: s.faculty, room: s.room, type: s.type, year: s.year, batch: s.batch })).sort((a, b) => `${a.day}-${a.time}-${a.subject}`.localeCompare(`${b.day}-${b.time}-${b.subject}`)) };
    const consistencyHash = CryptoJS.SHA256(JSON.stringify(consistencyData)).toString();

    return { totalSlots: this.generatedSlots.length, theorySlots, labSlots, facultyUtilization: Math.round(facultyUtilization * 100), roomUtilization: Math.round(roomUtilization * 100), constraintScore, consistencyHash };
  }

  private getFallbackAnalysisResult(): ConstraintAnalysisResult {
    // (Keep your existing implementation)
    return { 
      isValid: !this.conflicts.some(c => c.type === 'error'), 
      conflicts: this.conflicts.map(c => ({ 
        type: c.type === 'success' ? 'info' : c.type, 
        message: c.message, 
        severity: c.severity, 
        affectedEntities: c.affectedEntities 
      })), 
      optimizationSuggestions: ['Fallback used. Consider AI for optimization.', 'Review unscheduled items.'], 
      constraintScore: 60, 
      recommendedSlots: [] 
    };
  }

  private createLecturePool = (subjects: Subject[]): UnscheduledLecture[] => subjects.flatMap(s => Array(s.theoryHours).fill({ subject: s, year: s.year }));
  private createLabPool = (subjects: Subject[]): UnscheduledLab[] => subjects.flatMap(s => Array(Math.ceil(s.labHours / 2)).fill(0).flatMap(() => (['A', 'B', 'C'] as const).map(batch => ({ subject: s, year: s.year, batch }))));

  private reportUnscheduled(lectures: UnscheduledLecture[], labs: UnscheduledLab[]): void {
    labs.forEach(lab => this.conflicts.push({ type: 'error', message: `Unscheduled Lab: ${lab.subject.name} (${lab.year}-${lab.batch})`, severity: 'high', affectedEntities: [lab.subject.name] }));
    const unscheduledCounts: { [key: string]: number } = {};
    lectures.forEach(lec => { const key = `${lec.subject.name} (${lec.year})`; unscheduledCounts[key] = (unscheduledCounts[key] || 0) + 1; });
    for (const key in unscheduledCounts) { this.conflicts.push({ type: 'warning', message: `Unscheduled Lectures: ${unscheduledCounts[key]} for ${key}`, severity: 'medium', affectedEntities: [key] }); }
  }

  private getFacultyName = (subject: Subject): string => typeof subject.faculty === 'object' ? subject.faculty.name : subject.faculty;
  private getSlotDuration = (time: string): number => {
    // Check if it's a lab slot (2-hour duration) or theory slot (1-hour duration)
    const isLabSlot = this.MORNING_LAB_SLOTS.includes(time) || this.AFTERNOON_LAB_SLOTS.includes(time);
    return isLabSlot ? 2 : 1;
  };

  private getBatchTypeForYear = (year: 'SE' | 'TE' | 'BE'): 'Morning' | 'Afternoon' => {
    if (this.constraints.yearBatchType && this.constraints.yearBatchType[year]) return this.constraints.yearBatchType[year]!;
    console.warn(`No 'yearBatchType' constraint for ${year}. Defaulting BE->Afternoon, others->Morning.`);
    return year === 'BE' ? 'Afternoon' : 'Morning';
  };

  private getLabSlotsForYear = (year: 'SE' | 'TE' | 'BE'): string[] => {
    const batchType = this.getBatchTypeForYear(year);
    return batchType === 'Morning' ? this.MORNING_LAB_SLOTS : this.AFTERNOON_LAB_SLOTS;
  };

  private getBatchForLab = (subject: Subject, year: 'SE' | 'TE' | 'BE'): 'A' | 'B' | 'C' => {
    // (Keep existing implementation)
    const existingBatches = this.generatedSlots.filter(s => s.subject.includes(subject.name) && s.type === 'lab' && s.year === year).map(s => s.batch).filter(Boolean) as ('A' | 'B' | 'C')[];
    const batches: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
    const availableBatch = batches.find(batch => !existingBatches.includes(batch));
    if (!availableBatch) { console.warn(`All batches already scheduled for ${subject.name} lab`); return 'A'; } // Fallback
    return availableBatch;
  };

  private isFacultyAvailable = (name: string, day: string, time: string): boolean => !this.generatedSlots.some(s => s.faculty === name && s.day === day && this.doTimesOverlap(s.time, time));
  private isBatchAvailable = (year: string, batch: string | undefined, day: string, time: string): boolean => !this.generatedSlots.some(s => s.year === year && (!batch || !s.batch || s.batch === batch) && s.day === day && this.doTimesOverlap(s.time, time));

  private getAvailableRooms = (day: string, time: string, type: 'lab' | 'theory'): (Lab | Classroom)[] => {
    const allRooms = type === 'lab' ? this.labs : this.classrooms;
    const bookedRooms = new Set(this.generatedSlots.filter(s => s.day === day && this.doTimesOverlap(s.time, time)).map(s => s.room));
    return allRooms.filter(room => !bookedRooms.has(room.name));
  };

  private hadConsecutiveLabForBatch = (year: string, batch: string, day: string, time: string): boolean => {
    const labSlots = this.getLabSlotsForYear(year as 'SE' | 'TE' | 'BE');
    const timeIndex = labSlots.indexOf(time); 
    if (timeIndex <= 0) return false; 
    const previousTime = labSlots[timeIndex - 1]; 
    return this.generatedSlots.some(s => s.type === 'lab' && s.year === year && s.batch === batch && s.day === day && s.time === previousTime);
  };
  private hadConsecutiveLabForFaculty = (name: string, day: string, time: string): boolean => {
    // For faculty consecutive check, we need to check against all possible lab slots
    const allLabSlots = [...this.MORNING_LAB_SLOTS, ...this.AFTERNOON_LAB_SLOTS];
    const timeIndex = allLabSlots.indexOf(time); 
    if (timeIndex <= 0) return false; 
    const previousTime = allLabSlots[timeIndex - 1]; 
    return this.generatedSlots.some(s => s.type === 'lab' && s.faculty === name && s.day === day && s.time === previousTime);
  };

  private wasPreviousSlotSameSubject = (subject: Subject, year: string, day: string, time: string): boolean => {
    const currentIndex = this.ALL_THEORY_SLOTS.indexOf(time); if (currentIndex <= 0) return false; const previousTime = this.ALL_THEORY_SLOTS[currentIndex - 1]; return this.generatedSlots.some(s => s.year === year && s.day === day && s.subject === subject.name && s.type === 'theory' && s.time === previousTime);
  };

  private hasLabAlreadyOccurredTodayForBatch = (year: string, batch: string, day: string): boolean => this.generatedSlots.some(s => s.type === 'lab' && s.day === day && s.year === year && s.batch === batch);

  private doTimesOverlap = (time1: string, time2: string): boolean => {
    try { const [start1, end1] = time1.split('-').map(t => parseInt(t.replace(':', ''), 10)); const [start2, end2] = time2.split('-').map(t => parseInt(t.replace(':', ''), 10)); return Math.max(start1, start2) < Math.min(end1, end2); } catch (e) { console.error(`Error parsing times: ${time1}, ${time2}`, e); return true; }
  };

  // Add this method inside the AITimetableGenerator class

  private optimizeDistribution(targetYear: 'SE' | 'TE' | 'BE'): void {
    console.log(`Optimizing daily subject distribution for ${targetYear}...`);
    let swapsMade = 0;
    const maxSwaps = 20; // Limit iterations to prevent infinite loops
    let swapOccurredInIteration = false;

    for (let i = 0; i < maxSwaps; i++) {
      swapOccurredInIteration = false;
      const yearTheorySlots = this.generatedSlots.filter(s => s.year === targetYear && s.type === 'theory');

      // Group slots by day
      const slotsByDay: { [key: string]: ExtendedTimetableSlot[] } = {};
      this.DAYS.forEach(day => {
        slotsByDay[day] = yearTheorySlots.filter(s => s.day === day)
          .sort((a, b) => this.ALL_THEORY_SLOTS.indexOf(a.time) - this.ALL_THEORY_SLOTS.indexOf(b.time));
      });

      // Find days with duplicate theory subjects
      for (const day of this.DAYS) {
        if (swapOccurredInIteration) break; // Move to next iteration if swap happened

        const dailySlots = slotsByDay[day];
        const subjectCounts: { [subject: string]: number } = {};
        dailySlots.forEach(slot => {
          subjectCounts[slot.subject] = (subjectCounts[slot.subject] || 0) + 1;
        });

        const duplicateSubjects = Object.entries(subjectCounts)
          .filter(([_, count]) => count > 1)
          .map(([subject, _]) => subject);

        if (duplicateSubjects.length === 0) continue; // No duplicates on this day

        // Try to move one instance of a duplicate subject
        for (const subjectToMove of duplicateSubjects) {
          if (swapOccurredInIteration) break;

          // Find the second occurrence of the subject on this day
          const slotToMoveIndex = dailySlots.findIndex((slot, idx) => slot.subject === subjectToMove && idx > dailySlots.findIndex(s => s.subject === subjectToMove));
          if (slotToMoveIndex === -1) continue; // Should find one if count > 1

          const slotToMove = dailySlots[slotToMoveIndex];

          // Find a target day and slot to swap with
          for (const targetDay of this.DAYS) {
            if (targetDay === day || swapOccurredInIteration) continue;

            const targetDailySlots = slotsByDay[targetDay];
            // Check if subjectToMove is NOT present or present only once on targetDay
            const targetSubjectCount = targetDailySlots.filter(s => s.subject === subjectToMove).length;
            if (targetSubjectCount >= 1) continue; // Don't move if target day already has it

            // Find a candidate slot on the target day to swap with
            for (const candidateSlot of targetDailySlots) {
              // Avoid swapping with the same subject if it exists once
              if (candidateSlot.subject === subjectToMove) continue;

              // --- Check SWAP VALIDITY ---
              const facultyToMove = slotToMove.faculty;
              const facultyCandidate = candidateSlot.faculty;
              const timeToMoveTo = candidateSlot.time;
              const timeCandidateMovesTo = slotToMove.time;

              // Can facultyToMove teach at candidateSlot's time/day without double booking?
              if (!this.isFacultyAvailableForSwap(facultyToMove, targetDay, timeToMoveTo, candidateSlot.id)) continue;
              // Can facultyCandidate teach at slotToMove's time/day without double booking?
              if (!this.isFacultyAvailableForSwap(facultyCandidate, day, timeCandidateMovesTo, slotToMove.id)) continue;

              // Would moving slotToMove subject cause consecutive issues on target day?
              if (this.wouldCreateConsecutive(subjectToMove, targetYear, targetDay, timeToMoveTo, candidateSlot.id)) continue;
              // Would moving candidateSlot subject cause consecutive issues on original day?
              if (this.wouldCreateConsecutive(candidateSlot.subject, targetYear, day, timeCandidateMovesTo, slotToMove.id)) continue;

              // --- Perform SWAP ---
              console.log(`OPTIMIZE: Swapping [${slotToMove.subject} on ${day} ${slotToMove.time}] with [${candidateSlot.subject} on ${targetDay} ${candidateSlot.time}]`);

              // Find the actual slots in the main generatedSlots array
              const originalSlotIndex = this.generatedSlots.findIndex(s => s.id === slotToMove.id);
              const targetSlotIndex = this.generatedSlots.findIndex(s => s.id === candidateSlot.id);

              if (originalSlotIndex !== -1 && targetSlotIndex !== -1) {
                // Swap subject, faculty, semester, id (optional but good practice)
                const tempSubject = this.generatedSlots[originalSlotIndex].subject;
                const tempFaculty = this.generatedSlots[originalSlotIndex].faculty;
                const tempSemester = this.generatedSlots[originalSlotIndex].semester;
                // Optionally swap IDs or regenerate them based on new content
                // const tempId = this.generatedSlots[originalSlotIndex].id;

                this.generatedSlots[originalSlotIndex].subject = this.generatedSlots[targetSlotIndex].subject;
                this.generatedSlots[originalSlotIndex].faculty = this.generatedSlots[targetSlotIndex].faculty;
                this.generatedSlots[originalSlotIndex].semester = this.generatedSlots[targetSlotIndex].semester;
                // this.generatedSlots[originalSlotIndex].id = this.generatedSlots[targetSlotIndex].id;

                this.generatedSlots[targetSlotIndex].subject = tempSubject;
                this.generatedSlots[targetSlotIndex].faculty = tempFaculty;
                this.generatedSlots[targetSlotIndex].semester = tempSemester;
                // this.generatedSlots[targetSlotIndex].id = tempId;

                swapsMade++;
                swapOccurredInIteration = true;
                break; // Stop searching for candidate on this target day
              } else {
                console.error("Error finding slots for swap:", slotToMove.id, candidateSlot.id);
              }
            } // end loop candidate slots
          } // end loop target days
        } // end loop duplicate subjects
      } // end loop source days

      if (!swapOccurredInIteration) {
        console.log(`Optimization finished after ${i} iterations with ${swapsMade} swaps.`);
        break; // No swaps in this full pass, optimization complete
      }
    }
    if (swapsMade > 0 && !swapOccurredInIteration) { // Check if loop finished due to maxSwaps
      console.log(`Optimization reached max iterations (${maxSwaps}) with ${swapsMade} swaps.`);
    } else if (swapsMade === 0) {
      console.log("No distribution optimizations needed or possible.");
    }
  }


  // Helper for checking faculty availability during swap (excluding the slot being swapped out)
  private isFacultyAvailableForSwap = (facultyName: string, day: string, time: string, excludeSlotId: string): boolean => {
    return !this.generatedSlots.some(s =>
      s.id !== excludeSlotId && // Don't conflict with the slot we are moving *out* of
      s.faculty === facultyName &&
      s.day === day &&
      this.doTimesOverlap(s.time, time)
    );
  };

  // Helper to check if placing a subject would create a consecutive conflict
  private wouldCreateConsecutive = (subjectName: string, year: 'SE' | 'TE' | 'BE', day: string, time: string, excludeSlotId: string): boolean => {
    const timeIndex = this.ALL_THEORY_SLOTS.indexOf(time);
    if (timeIndex === -1) return false; // Should not happen

    const previousTime = timeIndex > 0 ? this.ALL_THEORY_SLOTS[timeIndex - 1] : null;
    const nextTime = timeIndex < this.ALL_THEORY_SLOTS.length - 1 ? this.ALL_THEORY_SLOTS[timeIndex + 1] : null;

    // Check if the slot *before* has the same subject
    if (previousTime) {
      const previousSlot = this.generatedSlots.find(s =>
        s.id !== excludeSlotId &&
        s.year === year &&
        s.day === day &&
        s.type === 'theory' &&
        s.time === previousTime &&
        s.subject === subjectName
      );
      if (previousSlot) return true;
    }

    // Check if the slot *after* has the same subject
    if (nextTime) {
      const nextSlot = this.generatedSlots.find(s =>
        s.id !== excludeSlotId &&
        s.year === year &&
        s.day === day &&
        s.type === 'theory' &&
        s.time === nextTime &&
        s.subject === subjectName
      );
      if (nextSlot) return true;
    }

    return false;
  };
} // End of AITimetableGenerator class