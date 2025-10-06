import { Subject, Faculty, Classroom, Lab, TimetableSlot, TimetableConstraints, Conflict } from '../types/timetable';

// Helper types for tracking unscheduled sessions
type UnscheduledLecture = { subject: Subject; year: 'SE' | 'TE' | 'BE'; }
type UnscheduledLab = { subject: Subject; year: 'SE' | 'TE' | 'BE'; batch: 'A' | 'B' | 'C'; }

export class TimetableGenerator {
  private subjects: Subject[];
  private faculty: Faculty[];
  private classrooms: Classroom[];
  private labs: Lab[];
  private constraints: TimetableConstraints;
  private generatedSlots: TimetableSlot[] = [];
  private conflicts: Conflict[] = [];

  private readonly DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  private readonly THEORY_SLOTS = [
    '8:00-9:00', '9:00-10:00', '10:15-11:15', '11:15-12:15',
    '1:15-2:15', '2:15-3:15', '3:15-4:15', '4:15-5:15'
  ];
  private readonly LAB_SLOTS = ['1:15-3:15', '3:15-5:15'];

  constructor(
    subjects: Subject[], faculty: Faculty[], classrooms: Classroom[],
    labs: Lab[], constraints: TimetableConstraints
  ) {
    this.subjects = subjects; this.faculty = faculty; this.classrooms = classrooms;
    this.labs = labs; this.constraints = constraints;
  }

  public generateTimetable(): { slots: TimetableSlot[]; conflicts: Conflict[] } {
    this.generatedSlots = [];
    this.conflicts = [];

    let unscheduledLectures = this.createLecturePool();
    let unscheduledLabs = this.createLabPool();
    
    this.scheduleLabs(unscheduledLabs);
    this.scheduleLectures(unscheduledLectures);
    
    this.reportUnscheduled(unscheduledLectures, unscheduledLabs);

    return { slots: this.generatedSlots, conflicts: this.conflicts };
  }

  // --- Pool Creation ---
  private createLecturePool = (): UnscheduledLecture[] => this.subjects.flatMap(s => Array(s.theoryHours).fill({ subject: s, year: s.year }));
  private createLabPool = (): UnscheduledLab[] => this.subjects.flatMap(s => 
    Array(Math.ceil(s.labHours / 2)).fill(0).flatMap(() => 
      (['A', 'B', 'C'] as const).map(batch => ({ subject: s, year: s.year, batch }))
    )
  );
  
  // --- Scheduling Logic ---
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
              year: candidate.year, batch: candidate.batch, duration: 2, semester: candidate.subject.semester
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

  private scheduleLectures(pool: UnscheduledLecture[]): void {
    for (const day of this.DAYS) {
      for (const time of this.THEORY_SLOTS) {
        for (const year of ['SE', 'TE', 'BE'] as const) {
          if (!this.isBatchAvailable(year, undefined, day, time)) continue;
          const assignedClassroom = this.classrooms.find(c => c.assignedYear === year);
          if (!assignedClassroom) continue;

          // Find a lecture that fits all rules, including the new "once-per-day" rule
          const bestFitIndex = pool.findIndex(lec =>
            lec.year === year &&
            this.isFacultyAvailable(this.getFacultyName(lec.subject), day, time) &&
            !this.wasPreviousSlotSameSubject(lec.subject, year, day, time) &&
            !this.hasLectureAlreadyOccurredToday(lec.subject, year, day) // <- NEW, STRICTER RULE
          );

          if (bestFitIndex > -1) {
            const [lectureToSchedule] = pool.splice(bestFitIndex, 1);
            const slot: TimetableSlot = {
               id: `${year}-${lectureToSchedule.subject.code}-${day}-${time}`,
               day, time, subject: lectureToSchedule.subject.name,
               faculty: this.getFacultyName(lectureToSchedule.subject), room: assignedClassroom.name,
               type: 'theory', year, duration: 1, semester: lectureToSchedule.subject.semester
            };
            this.generatedSlots.push(slot);
          }
        }
      }
    }
  }

  // --- Availability Checkers ---

  /**
   * **NEW FUNCTION**
   * Checks if the same theory lecture has already been scheduled for this year on this day.
   */
  private hasLectureAlreadyOccurredToday(subject: Subject, year: string, day: string): boolean {
    return this.generatedSlots.some(s =>
      s.type === 'theory' && s.day === day &&
      s.year === year && s.subject === subject.name
    );
  }

  private isFacultyAvailable = (name: string, day: string, time: string): boolean => !this.generatedSlots.some(s => s.faculty === name && s.day === day && this.doTimesOverlap(s.time, time));
  private isBatchAvailable = (year: string, batch: string | undefined, day: string, time: string): boolean => !this.generatedSlots.some(s => s.year === year && (!batch || !s.batch || s.batch === batch) && s.day === day && this.doTimesOverlap(s.time, time));
  private getAvailableRooms = (day: string, time: string, type: 'lab' | 'theory'): (Lab | Classroom)[] => {
    const allRooms = type === 'lab' ? this.labs : this.classrooms;
    const bookedRooms = this.generatedSlots.filter(s => s.day === day && this.doTimesOverlap(s.time, time)).map(s => s.room);
    return allRooms.filter(room => !bookedRooms.includes(room.name));
  };
  private hadConsecutiveLabForBatch = (year: string, batch: string, day: string, time: string): boolean => time === '3:15-5:15' && this.generatedSlots.some(s => s.type === 'lab' && s.year === year && s.batch === batch && s.day === day && s.time === '1:15-3:15');
  private hadConsecutiveLabForFaculty = (name: string, day: string, time: string): boolean => time === '3:15-5:15' && this.generatedSlots.some(s => s.type === 'lab' && s.faculty === name && s.day === day && s.time === '1:15-3:15');
  private wasPreviousSlotSameSubject = (subject: Subject, year: string, day: string, time: string): boolean => {
    const currentIndex = this.THEORY_SLOTS.indexOf(time);
    if (currentIndex <= 0 || time === '1:15-2:15') return false; 
    const previousTime = this.THEORY_SLOTS[currentIndex - 1];
    return this.generatedSlots.some(s => s.year === year && s.day === day && s.subject === subject.name && s.time === previousTime);
  };
  
  // --- Helpers & Finalization ---
  private reportUnscheduled(lectures: UnscheduledLecture[], labs: UnscheduledLab[]): void {
    labs.forEach(lab => this.conflicts.push({ type: 'error', message: `Could not schedule lab for ${lab.subject.name} (${lab.year}-${lab.batch}). Not enough slots/resources.`, severity: 'high', affectedEntities: [lab.subject.name, `${lab.year}-${lab.batch}`] }));
    const unscheduledCounts: { [key: string]: number } = {};
    lectures.forEach(lec => {
      const key = `${lec.subject.name} (${lec.year})`;
      unscheduledCounts[key] = (unscheduledCounts[key] || 0) + 1;
    });
    for (const key in unscheduledCounts) {
      this.conflicts.push({ type: 'warning', message: `Could not schedule ${unscheduledCounts[key]} lecture(s) for ${key}.`, severity: 'medium', affectedEntities: [key] });
    }
  }

  private getFacultyName = (subject: Subject): string => typeof subject.faculty === 'object' ? subject.faculty.name : subject.faculty;
  private doTimesOverlap = (time1: string, time2: string): boolean => {
    const [start1, end1] = time1.split('-').map(t => parseInt(t.replace(':', ''), 10));
    const [start2, end2] = time2.split('-').map(t => parseInt(t.replace(':', ''), 10));
    return Math.max(start1, start2) < Math.min(end1, end2);
  };
}