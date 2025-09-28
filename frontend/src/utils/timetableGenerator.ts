import { Subject, Faculty, Classroom, Lab, TimetableSlot, TimetableConstraints, Conflict } from '../types/timetable';

export class TimetableGenerator {
  private subjects: Subject[];
  private faculty: Faculty[];
  private classrooms: Classroom[];
  private labs: Lab[];
  private constraints: TimetableConstraints;
  private generatedSlots: TimetableSlot[] = [];
  private conflicts: Conflict[] = [];

  constructor(
    subjects: Subject[],
    faculty: Faculty[],
    classrooms: Classroom[],
    labs: Lab[],
    constraints: TimetableConstraints
  ) {
    this.subjects = subjects;
    this.faculty = faculty;
    this.classrooms = classrooms;
    this.labs = labs;
    this.constraints = constraints;
  }

  public generateTimetable(): { slots: TimetableSlot[]; conflicts: Conflict[] } {
    this.generatedSlots = [];
    this.conflicts = [];

    try {
      // Step 1: Generate theory schedules for each year
      this.generateTheorySchedules();
      
      // Step 2: Generate lab schedules for each batch
      this.generateLabSchedules();
      
      // Step 3: Validate constraints and detect conflicts
      this.validateConstraints();
      
      // Step 4: Optimize schedule if possible
      this.optimizeSchedule();

      return {
        slots: this.generatedSlots,
        conflicts: this.conflicts
      };
    } catch (error) {
      this.conflicts.push({
        type: 'error',
        message: `Timetable generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
        affectedEntities: ['system']
      });
      
      return {
        slots: [],
        conflicts: this.conflicts
      };
    }
  }

 // Update the generateTheorySchedules method in timetableGenerator.ts to include semester

private generateTheorySchedules(): void {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const morningSlots = ['8:00-9:00', '9:00-10:00', '10:15-11:15', '11:15-12:15'];
  const afternoonSlots = ['1:15-2:15', '2:15-3:15', '3:15-4:15', '4:15-5:15'];

  for (const year of ['SE', 'TE', 'BE'] as const) {
    const yearSubjects = this.subjects.filter(s => s.year === year);
    const assignedClassroom = this.classrooms.find(c => c.assignedYear === year);
    
    if (!assignedClassroom) {
      this.conflicts.push({
        type: 'error',
        message: `No classroom assigned for year ${year}`,
        severity: 'high',
        affectedEntities: [year]
      });
      continue;
    }

    let currentDay = 0;
    let currentSlot = 0;
    const availableSlots = assignedClassroom.timeSlot === '8AM-3PM' 
      ? [...morningSlots, ...afternoonSlots.slice(0, 2)]
      : [...morningSlots.slice(2), ...afternoonSlots];

    for (const subject of yearSubjects) {
      const facultyMember = this.faculty.find(f => f.name === subject.faculty);
      
      for (let hour = 0; hour < subject.theoryHours; hour++) {
        if (currentSlot >= availableSlots.length) {
          currentDay++;
          currentSlot = 0;
        }

        if (currentDay >= days.length) {
          this.conflicts.push({
            type: 'warning',
            message: `Insufficient slots for ${subject.name} in ${year}`,
            severity: 'medium',
            affectedEntities: [subject.name, year]
          });
          break;
        }

        const slot: TimetableSlot = {
          id: `${year}-${subject.code}-${days[currentDay]}-${availableSlots[currentSlot]}`,
          day: days[currentDay],
          time: availableSlots[currentSlot],
          subject: subject.name,
          faculty: subject.faculty,
          room: assignedClassroom.name,
          type: 'theory',
          year: year,
          duration: 1,
          semester: subject.semester // Add semester from subject data
        };

        // Check for faculty conflicts
        if (this.hasFacultyConflict(slot)) {
          this.conflicts.push({
            type: 'warning',
            message: `Faculty conflict for ${subject.faculty} on ${days[currentDay]} at ${availableSlots[currentSlot]}`,
            severity: 'medium',
            affectedEntities: [subject.faculty, subject.name]
          });
        } else {
          this.generatedSlots.push(slot);
        }

        currentSlot++;
      }
    }
  }
}

// Update the generateLabSchedules method to include semester

private generateLabSchedules(): void {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const labSlots = ['1:15-3:15', '3:15-5:15']; // 2-hour slots
  
  for (const year of ['SE', 'TE', 'BE'] as const) {
    for (const batch of ['A', 'B', 'C'] as const) {
      const yearSubjects = this.subjects.filter(s => s.year === year && s.labHours > 0);
      
      let currentDay = 0;
      let currentSlot = 0;

      for (const subject of yearSubjects) {
        const sessionsNeeded = Math.ceil(subject.labHours / 2); // 2-hour sessions
        
        for (let session = 0; session < sessionsNeeded; session++) {
          if (currentSlot >= labSlots.length) {
            currentDay++;
            currentSlot = 0;
          }

          if (currentDay >= days.length) {
            this.conflicts.push({
              type: 'warning',
              message: `Insufficient lab slots for ${subject.name} - ${year}-${batch}`,
              severity: 'medium',
              affectedEntities: [subject.name, `${year}-${batch}`]
            });
            break;
          }

          const availableLab = this.findAvailableLab(days[currentDay], labSlots[currentSlot], subject);
          
          if (!availableLab) {
            this.conflicts.push({
              type: 'warning',
              message: `No available lab for ${subject.name} - ${year}-${batch} on ${days[currentDay]}`,
              severity: 'medium',
              affectedEntities: [subject.name, `${year}-${batch}`]
            });
            currentSlot++;
            continue;
          }

          const slot: TimetableSlot = {
            id: `${year}-${batch}-${subject.code}-${days[currentDay]}-${labSlots[currentSlot]}`,
            day: days[currentDay],
            time: labSlots[currentSlot],
            subject: `${subject.name} Lab`,
            faculty: subject.faculty,
            room: availableLab.name,
            type: 'lab',
            year: year,
            batch: batch,
            duration: 2,
            semester: subject.semester // Add semester from subject data
          };

          this.generatedSlots.push(slot);
          currentSlot++;
        }
      }
    }
  }
}

  private findAvailableLab(day: string, time: string, subject: Subject): Lab | null {
    // Find a lab that's not already booked for this time slot
    const bookedLabs = this.generatedSlots
      .filter(slot => slot.day === day && slot.time === time && slot.type === 'lab')
      .map(slot => slot.room);

    return this.labs.find(lab => !bookedLabs.includes(lab.name)) || null;
  }

  private hasFacultyConflict(newSlot: TimetableSlot): boolean {
    return this.generatedSlots.some(slot => 
      slot.faculty === newSlot.faculty &&
      slot.day === newSlot.day &&
      slot.time === newSlot.time
    );
  }

  private validateConstraints(): void {
    // Check faculty workload constraints
    this.validateFacultyWorkload();
    
    // Check consecutive hours constraint
    this.validateConsecutiveHours();
    
    // Check break requirements
    this.validateBreakRequirements();
  }

  private validateFacultyWorkload(): void {
    const facultyWorkload = new Map<string, Map<string, number>>();

    // Calculate daily workload for each faculty
    this.generatedSlots.forEach(slot => {
      if (!facultyWorkload.has(slot.faculty)) {
        facultyWorkload.set(slot.faculty, new Map());
      }
      
      const dayMap = facultyWorkload.get(slot.faculty)!;
      const currentHours = dayMap.get(slot.day) || 0;
      dayMap.set(slot.day, currentHours + slot.duration);
    });

    // Check against faculty preferences
    facultyWorkload.forEach((dayMap, facultyName) => {
      const facultyMember = this.faculty.find(f => f.name === facultyName);
      if (!facultyMember) return;

      dayMap.forEach((hours, day) => {
        if (hours > facultyMember.maxHoursPerDay) {
          this.conflicts.push({
            type: 'warning',
            message: `${facultyName} has ${hours} hours on ${day} (exceeds preference of ${facultyMember.maxHoursPerDay} hours)`,
            severity: 'medium',
            affectedEntities: [facultyName]
          });
        }
      });
    });
  }

  private validateConsecutiveHours(): void {
    // Group slots by faculty and day
    const facultyDaySlots = new Map<string, Map<string, TimetableSlot[]>>();

    this.generatedSlots.forEach(slot => {
      if (!facultyDaySlots.has(slot.faculty)) {
        facultyDaySlots.set(slot.faculty, new Map());
      }
      
      const dayMap = facultyDaySlots.get(slot.faculty)!;
      if (!dayMap.has(slot.day)) {
        dayMap.set(slot.day, []);
      }
      
      dayMap.get(slot.day)!.push(slot);
    });

    // Check for excessive consecutive hours
    facultyDaySlots.forEach((dayMap, facultyName) => {
      dayMap.forEach((slots, day) => {
        const sortedSlots = slots.sort((a, b) => a.time.localeCompare(b.time));
        let consecutiveHours = 0;
        let maxConsecutive = 0;

        for (let i = 0; i < sortedSlots.length; i++) {
          if (i === 0 || this.areConsecutiveSlots(sortedSlots[i-1], sortedSlots[i])) {
            consecutiveHours += sortedSlots[i].duration;
          } else {
            maxConsecutive = Math.max(maxConsecutive, consecutiveHours);
            consecutiveHours = sortedSlots[i].duration;
          }
        }
        maxConsecutive = Math.max(maxConsecutive, consecutiveHours);

        if (maxConsecutive > this.constraints.maxConsecutiveHours) {
          this.conflicts.push({
            type: 'warning',
            message: `${facultyName} has ${maxConsecutive} consecutive hours on ${day}`,
            severity: 'medium',
            affectedEntities: [facultyName]
          });
        }
      });
    });
  }

  private validateBreakRequirements(): void {
    // Check if faculty have at least one free slot per day
    const facultyDaySlots = new Map<string, Set<string>>();

    this.generatedSlots.forEach(slot => {
      const key = `${slot.faculty}-${slot.day}`;
      if (!facultyDaySlots.has(key)) {
        facultyDaySlots.set(key, new Set());
      }
      facultyDaySlots.get(key)!.add(slot.time);
    });

    // Define all possible time slots
    const allSlots = [
      '8:00-9:00', '9:00-10:00', '10:15-11:15', '11:15-12:15',
      '1:15-2:15', '2:15-3:15', '3:15-4:15', '4:15-5:15'
    ];

    facultyDaySlots.forEach((usedSlots, key) => {
      const [facultyName, day] = key.split('-');
      const freeSlots = allSlots.filter(slot => !usedSlots.has(slot));
      
      if (freeSlots.length === 0) {
        this.conflicts.push({
          type: 'error',
          message: `${facultyName} has no free slots on ${day}`,
          severity: 'high',
          affectedEntities: [facultyName]
        });
      }
    });
  }

  private areConsecutiveSlots(slot1: TimetableSlot, slot2: TimetableSlot): boolean {
    const time1End = this.getSlotEndTime(slot1.time);
    const time2Start = this.getSlotStartTime(slot2.time);
    
    return time1End === time2Start || 
           (time1End === '10:00' && time2Start === '10:15'); // Account for break
  }

  private getSlotStartTime(timeRange: string): string {
    return timeRange.split('-')[0];
  }

  private getSlotEndTime(timeRange: string): string {
    return timeRange.split('-')[1];
  }

  private optimizeSchedule(): void {
    // Simple optimization: try to balance workload across days
    const facultyDailyHours = new Map<string, Map<string, number>>();
    
    this.generatedSlots.forEach(slot => {
      if (!facultyDailyHours.has(slot.faculty)) {
        facultyDailyHours.set(slot.faculty, new Map());
      }
      
      const dayMap = facultyDailyHours.get(slot.faculty)!;
      const current = dayMap.get(slot.day) || 0;
      dayMap.set(slot.day, current + slot.duration);
    });

    // Add optimization suggestions as info conflicts
    facultyDailyHours.forEach((dayMap, facultyName) => {
      const hours = Array.from(dayMap.values());
      const maxHours = Math.max(...hours);
      const minHours = Math.min(...hours);
      
      if (maxHours - minHours > 2) {
        this.conflicts.push({
          type: 'info',
          message: `${facultyName}'s workload could be better balanced (${minHours}-${maxHours} hours/day)`,
          severity: 'low',
          affectedEntities: [facultyName]
        });
      }
    });
  }
}

export function createSampleData() {
  const subjects: Subject[] = [
    {
      id: '1',
      name: 'Database Management Systems',
      code: 'DBMS',
      year: 'TE',
      theoryHours: 3,
      labHours: 2,
      faculty: 'Dr. Sharma',
      semester: 3,
    },
    {
      id: '2',
      name: 'Software Engineering',
      code: 'SE',
      year: 'TE',
      theoryHours: 4,
      labHours: 2,
      faculty: 'Prof. Patel',
      semester: 3,
    },
    {
      id: '3',
      name: 'Computer Networks',
      code: 'CN',
      year: 'TE',
      theoryHours: 3,
      labHours: 2,
      faculty: 'Dr. Kumar',
      semester: 3,
    },
  ];

  const faculty: Faculty[] = [
    {
      id: '1',
      name: 'Dr. Sharma',
      email: 'dr.sharma@college.edu',
      phone: '+91 9876543210',
      department: 'Computer Engineering',
      subjects: ['DBMS', 'Data Structures'],
      maxHoursPerDay: 4,
      preferredSlots: ['Morning'],
    },
    {
      id: '2',
      name: 'Prof. Patel',
      email: 'prof.patel@college.edu',
      phone: '+91 9876543211',
      department: 'Computer Engineering',
      subjects: ['Software Engineering', 'Web Development'],
      maxHoursPerDay: 5,
      preferredSlots: ['Morning', 'Afternoon'],
    },
    {
      id: '3',
      name: 'Dr. Kumar',
      email: 'dr.kumar@college.edu',
      phone: '+91 9876543212',
      department: 'Computer Engineering',
      subjects: ['Computer Networks', 'Operating Systems'],
      maxHoursPerDay: 4,
      preferredSlots: ['Afternoon'],
    },
  ];

  return { subjects, faculty };
}