import { Subject, Faculty, TimetableSlot, Conflict } from '../types/timetable';

export interface ConstraintRule {
  id: string;
  name: string;
  type: 'hard' | 'soft';
  weight: number;
  validate: (slot: TimetableSlot, allSlots: TimetableSlot[], context: any) => boolean;
  getMessage: (slot: TimetableSlot) => string;
}

export class ConstraintSolver {
  private rules: ConstraintRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Hard constraints (must be satisfied)
    this.rules.push({
      id: 'no-faculty-conflict',
      name: 'No Faculty Time Conflict',
      type: 'hard',
      weight: 100,
      validate: (slot, allSlots) => {
        return !allSlots.some(existing => 
          existing.faculty === slot.faculty &&
          existing.day === slot.day &&
          existing.time === slot.time &&
          existing.id !== slot.id
        );
      },
      getMessage: (slot) => `Faculty ${slot.faculty} has conflicting assignments at ${slot.time} on ${slot.day}`
    });

    this.rules.push({
      id: 'no-room-conflict',
      name: 'No Room Double Booking',
      type: 'hard',
      weight: 100,
      validate: (slot, allSlots) => {
        return !allSlots.some(existing => 
          existing.room === slot.room &&
          existing.day === slot.day &&
          existing.time === slot.time &&
          existing.id !== slot.id
        );
      },
      getMessage: (slot) => `Room ${slot.room} is double-booked at ${slot.time} on ${slot.day}`
    });

    this.rules.push({
      id: 'no-student-conflict',
      name: 'No Student Time Conflict',
      type: 'hard',
      weight: 100,
      validate: (slot, allSlots) => {
        return !allSlots.some(existing => 
          existing.year === slot.year &&
          existing.batch === slot.batch &&
          existing.day === slot.day &&
          existing.time === slot.time &&
          existing.id !== slot.id
        );
      },
      getMessage: (slot) => `Students have conflicting classes at ${slot.time} on ${slot.day}`
    });

    // Soft constraints (preferences)
    this.rules.push({
      id: 'faculty-max-hours',
      name: 'Faculty Daily Hour Limit',
      type: 'soft',
      weight: 80,
      validate: (slot, allSlots, context) => {
        const faculty = context.faculty.find((f: Faculty) => f.name === slot.faculty);
        if (!faculty) return true;

        const dailyHours = allSlots
          .filter(s => s.faculty === slot.faculty && s.day === slot.day)
          .reduce((sum, s) => sum + s.duration, 0);

        return dailyHours <= faculty.maxHoursPerDay;
      },
      getMessage: (slot) => `Faculty ${slot.faculty} exceeds preferred daily hours on ${slot.day}`
    });

    this.rules.push({
      id: 'no-back-to-back-labs',
      name: 'No Consecutive Labs for Faculty',
      type: 'soft',
      weight: 70,
      validate: (slot, allSlots) => {
        if (slot.type !== 'lab') return true;

        const timeSlots = ['1:15-3:15', '3:15-5:15'];
        const currentIndex = timeSlots.indexOf(slot.time);
        
        if (currentIndex === -1) return true;

        // Check previous and next slots
        const adjacentTimes = [
          timeSlots[currentIndex - 1],
          timeSlots[currentIndex + 1]
        ].filter(Boolean);

        return !allSlots.some(existing => 
          existing.faculty === slot.faculty &&
          existing.day === slot.day &&
          existing.type === 'lab' &&
          adjacentTimes.includes(existing.time) &&
          existing.id !== slot.id
        );
      },
      getMessage: (slot) => `Faculty ${slot.faculty} has back-to-back lab sessions on ${slot.day}`
    });

    this.rules.push({
      id: 'lab-afternoon-preference',
      name: 'Prefer Labs in Afternoon',
      type: 'soft',
      weight: 60,
      validate: (slot) => {
        if (slot.type !== 'lab') return true;
        const hour = parseInt(slot.time.split(':')[0]);
        return hour >= 13; // 1 PM or later
      },
      getMessage: (slot) => `Lab session ${slot.subject} scheduled in morning hours`
    });

    this.rules.push({
      id: 'faculty-preferred-slots',
      name: 'Faculty Slot Preferences',
      type: 'soft',
      weight: 50,
      validate: (slot, allSlots, context) => {
        const faculty = context.faculty.find((f: Faculty) => f.name === slot.faculty);
        if (!faculty || faculty.preferredSlots.length === 0) return true;

        const hour = parseInt(slot.time.split(':')[0]);
        const isPreferred = faculty.preferredSlots.some(pref => {
          if (pref.includes('Morning') && hour >= 8 && hour < 12) return true;
          if (pref.includes('Afternoon') && hour >= 12 && hour < 17) return true;
          if (pref.includes('Evening') && hour >= 17) return true;
          return false;
        });

        return isPreferred;
      },
      getMessage: (slot) => `Faculty ${slot.faculty} assigned outside preferred time slots`
    });
  }

  public validateTimetable(
    slots: TimetableSlot[], 
    context: { subjects: Subject[]; faculty: Faculty[] }
  ): { isValid: boolean; conflicts: Conflict[]; score: number } {
    const conflicts: Conflict[] = [];
    let score = 0;
    let hardConstraintViolations = 0;

    for (const slot of slots) {
      for (const rule of this.rules) {
        const isValid = rule.validate(slot, slots, context);
        
        if (!isValid) {
          const conflict: Conflict = {
            type: rule.type === 'hard' ? 'error' : 'warning',
            message: rule.getMessage(slot),
            severity: rule.type === 'hard' ? 'high' : 'medium',
            affectedEntities: [slot.faculty, slot.subject, slot.room]
          };
          
          conflicts.push(conflict);
          
          if (rule.type === 'hard') {
            hardConstraintViolations++;
          } else {
            score -= rule.weight;
          }
        } else if (rule.type === 'soft') {
          score += rule.weight;
        }
      }
    }

    return {
      isValid: hardConstraintViolations === 0,
      conflicts,
      score
    };
  }

  public addCustomRule(rule: ConstraintRule): void {
    this.rules.push(rule);
  }

  public removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  public getOptimizationSuggestions(
    slots: TimetableSlot[],
    context: { subjects: Subject[]; faculty: Faculty[] }
  ): string[] {
    const suggestions: string[] = [];
    
    // Analyze faculty workload distribution
    const facultyWorkload = new Map<string, Map<string, number>>();
    
    slots.forEach(slot => {
      if (!facultyWorkload.has(slot.faculty)) {
        facultyWorkload.set(slot.faculty, new Map());
      }
      
      const dayMap = facultyWorkload.get(slot.faculty)!;
      const current = dayMap.get(slot.day) || 0;
      dayMap.set(slot.day, current + slot.duration);
    });

    // Check workload balance
    facultyWorkload.forEach((dayMap, facultyName) => {
      const hours = Array.from(dayMap.values());
      const maxHours = Math.max(...hours);
      const minHours = Math.min(...hours);
      
      if (maxHours - minHours > 2) {
        suggestions.push(
          `Consider redistributing ${facultyName}'s workload - varies from ${minHours} to ${maxHours} hours per day`
        );
      }
    });

    // Check lab utilization
    const labUtilization = new Map<string, number>();
    
    slots.filter(s => s.type === 'lab').forEach(slot => {
      labUtilization.set(slot.room, (labUtilization.get(slot.room) || 0) + 1);
    });

    const totalLabSlots = 5 * 2; // 5 days × 2 afternoon slots
    const averageUtilization = Array.from(labUtilization.values()).reduce((sum, count) => sum + count, 0) / labUtilization.size;
    
    if (averageUtilization < totalLabSlots * 0.7) {
      suggestions.push('Lab utilization is below optimal - consider adding more lab sessions or reducing lab inventory');
    }

    return suggestions;
  }
}

export const defaultConstraintSolver = new ConstraintSolver();