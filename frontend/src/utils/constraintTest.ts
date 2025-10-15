import { AITimetableGenerator } from './aiTimetableGenerator';
import { Subject, Faculty, Classroom, Lab, TimetableConstraints } from '../types/timetable';

/**
 * Test utility to verify constraint enforcement
 */
export class ConstraintTest {
  /**
   * Test constraint enforcement with problematic data
   */
  public static async testConstraintEnforcement(): Promise<{
    passed: boolean;
    violations: string[];
    summary: string;
  }> {
    const violations: string[] = [];
    
    // Create test data that would previously cause violations
    const testData = this.createProblematicTestData();
    
    const generator = new AITimetableGenerator(
      testData.subjects,
      testData.faculty,
      testData.classrooms,
      testData.labs,
      testData.constraints
    );
    
    const result = await generator.generateTimetable('SE', 3);
    
    // Check for constraint violations
    const theoryCounts = new Map<string, number>();
    const consecutiveViolations: string[] = [];
    const labBatchCounts = new Map<string, Map<string, number>>();
    
    result.slots.forEach(slot => {
      const key = `${slot.subject}-${slot.year}`;
      
      if (slot.type === 'theory') {
        theoryCounts.set(key, (theoryCounts.get(key) || 0) + 1);
      }
      
      if (slot.type === 'lab' && slot.batch) {
        if (!labBatchCounts.has(key)) {
          labBatchCounts.set(key, new Map());
        }
        const batchCounts = labBatchCounts.get(key)!;
        batchCounts.set(slot.batch, (batchCounts.get(slot.batch) || 0) + 1);
      }
    });
    
    // Check theory session limits
    theoryCounts.forEach((count, subject) => {
      if (count > 3) {
        violations.push(`❌ ${subject}: Has ${count} theory sessions (max 3 allowed)`);
      }
    });
    
    // Check for consecutive sessions
    const slotsBySubject = new Map<string, any[]>();
    result.slots.forEach(slot => {
      const key = `${slot.subject}-${slot.year}`;
      if (!slotsBySubject.has(key)) {
        slotsBySubject.set(key, []);
      }
      slotsBySubject.get(key)!.push(slot);
    });
    
    slotsBySubject.forEach((slots, subject) => {
      const theorySlots = slots.filter(s => s.type === 'theory');
      const sortedSlots = theorySlots.sort((a, b) => {
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        if (dayDiff !== 0) return dayDiff;
        const timeOrder = ['8:00-9:00', '9:00-10:00', '10:15-11:15', '11:15-12:15', '1:15-2:15', '2:15-3:15', '3:15-4:15', '4:15-5:15'];
        return timeOrder.indexOf(a.time) - timeOrder.indexOf(b.time);
      });
      
      for (let i = 0; i < sortedSlots.length - 1; i++) {
        const current = sortedSlots[i];
        const next = sortedSlots[i + 1];
        
        if (current.day === next.day) {
          const timeOrder = ['8:00-9:00', '9:00-10:00', '10:15-11:15', '11:15-12:15', '1:15-2:15', '2:15-3:15', '3:15-4:15', '4:15-5:15'];
          const currentIndex = timeOrder.indexOf(current.time);
          const nextIndex = timeOrder.indexOf(next.time);
          
          if (nextIndex === currentIndex + 1) {
            violations.push(`❌ ${subject}: Consecutive sessions on ${current.day} (${current.time} → ${next.time})`);
          }
        }
      }
    });
    
    // Check lab batch distribution
    labBatchCounts.forEach((batchCounts, subject) => {
      const batches = Array.from(batchCounts.keys());
      if (batches.length < 3) {
        violations.push(`❌ ${subject}: Lab scheduled for only ${batches.length} batches (A, B, C required)`);
      }
      
      batchCounts.forEach((count, batch) => {
        if (count > 1) {
          violations.push(`❌ ${subject}: Lab scheduled ${count} times for Batch ${batch} (max 1 allowed)`);
        }
      });
    });
    
    const passed = violations.length === 0;
    const summary = passed 
      ? `✅ All constraints enforced successfully! Generated ${result.slots.length} slots with ${result.analysisResult.constraintScore}% satisfaction.`
      : `❌ Found ${violations.length} constraint violations.`;
    
    return { passed, violations, summary };
  }
  
  /**
   * Create test data that would previously cause violations
   */
  private static createProblematicTestData(): {
    subjects: Subject[];
    faculty: Faculty[];
    classrooms: Classroom[];
    labs: Lab[];
    constraints: TimetableConstraints;
  } {
    const subjects: Subject[] = [
      {
        id: '1',
        name: 'DBMS',
        code: 'DBMS',
        year: 'SE',
        theoryHours: 3, // Should result in exactly 3 sessions
        labHours: 2,
        faculty: 'Prof. Y. D. Bhise',
        semester: 3
      },
      {
        id: '2',
        name: 'COA',
        code: 'COA',
        year: 'SE',
        theoryHours: 3, // Should result in exactly 3 sessions
        labHours: 2,
        faculty: 'Prof. M. P. Mahajan',
        semester: 3
      },
      {
        id: '3',
        name: 'AI',
        code: 'AI',
        year: 'SE',
        theoryHours: 3, // Should result in exactly 3 sessions
        labHours: 2,
        faculty: 'Prof. S. K. Singh',
        semester: 3
      },
      {
        id: '4',
        name: 'PBL',
        code: 'PBL',
        year: 'SE',
        theoryHours: 2,
        labHours: 2,
        faculty: 'Prof. A. B. Patel',
        semester: 3
      },
      {
        id: '5',
        name: 'DSA',
        code: 'DSA',
        year: 'SE',
        theoryHours: 3,
        labHours: 2,
        faculty: 'Prof. C. D. Sharma',
        semester: 3
      },
      {
        id: '6',
        name: 'IoT',
        code: 'IoT',
        year: 'SE',
        theoryHours: 3,
        labHours: 2,
        faculty: 'Prof. E. F. Gupta',
        semester: 3
      }
    ];
    
    const faculty: Faculty[] = [
      {
        id: '1',
        name: 'Prof. Y. D. Bhise',
        email: 'bhise@university.edu',
        phone: '123-456-7890',
        department: 'Computer Science',
        subjects: ['DBMS'],
        maxHoursPerDay: 6,
        preferredSlots: ['Morning', 'Afternoon']
      },
      {
        id: '2',
        name: 'Prof. M. P. Mahajan',
        email: 'mahajan@university.edu',
        phone: '123-456-7891',
        department: 'Computer Science',
        subjects: ['COA'],
        maxHoursPerDay: 6,
        preferredSlots: ['Morning']
      },
      {
        id: '3',
        name: 'Prof. S. K. Singh',
        email: 'singh@university.edu',
        phone: '123-456-7892',
        department: 'Computer Science',
        subjects: ['AI'],
        maxHoursPerDay: 6,
        preferredSlots: ['Afternoon']
      },
      {
        id: '4',
        name: 'Prof. A. B. Patel',
        email: 'patel@university.edu',
        phone: '123-456-7893',
        department: 'Computer Science',
        subjects: ['PBL'],
        maxHoursPerDay: 6,
        preferredSlots: ['Morning']
      },
      {
        id: '5',
        name: 'Prof. C. D. Sharma',
        email: 'sharma@university.edu',
        phone: '123-456-7894',
        department: 'Computer Science',
        subjects: ['DSA'],
        maxHoursPerDay: 6,
        preferredSlots: ['Afternoon']
      },
      {
        id: '6',
        name: 'Prof. E. F. Gupta',
        email: 'gupta@university.edu',
        phone: '123-456-7895',
        department: 'Computer Science',
        subjects: ['IoT'],
        maxHoursPerDay: 6,
        preferredSlots: ['Morning']
      }
    ];
    
    const classrooms: Classroom[] = [
      {
        id: '1',
        name: 'E404',
        capacity: 60,
        timeSlot: '8AM-3PM',
        assignedYear: 'SE',
        floor: 4,
        amenities: ['Projector', 'Whiteboard']
      }
    ];
    
    const labs: Lab[] = [
      {
        id: '1',
        name: 'E301-A',
        capacity: 30,
        type: 'Computer Lab',
        equipment: ['Computers', 'Network Equipment'],
        floor: 3,
        availableHours: ['1:15-3:15', '3:15-5:15'],
        compatibleSubjects: ['DBMS', 'COA', 'AI', 'PBL', 'DSA', 'IoT']
      },
      {
        id: '2',
        name: 'E301-B',
        capacity: 30,
        type: 'Computer Lab',
        equipment: ['Computers', 'Network Equipment'],
        floor: 3,
        availableHours: ['1:15-3:15', '3:15-5:15'],
        compatibleSubjects: ['DBMS', 'COA', 'AI', 'PBL', 'DSA', 'IoT']
      }
    ];
    
    const constraints: TimetableConstraints = {
      maxHoursPerDay: 6,
      minBreakBetweenClasses: 15,
      maxConsecutiveHours: 3,
      prioritizeLabAfternoon: true,
      allowBackToBackTheory: false,
      facultyRestSlots: 1
    };
    
    return { subjects, faculty, classrooms, labs, constraints };
  }
  
  /**
   * Run comprehensive constraint test
   */
  public static async runConstraintTest(): Promise<void> {
    console.log('🧪 Running Constraint Enforcement Test...');
    
    try {
      const result = await this.testConstraintEnforcement();
      
      console.log(result.summary);
      
      if (!result.passed) {
        console.log('🔍 Constraint violations found:');
        result.violations.forEach(violation => console.log(`  ${violation}`));
      } else {
        console.log('🎉 All critical constraints are properly enforced!');
      }
    } catch (error) {
      console.error('❌ Constraint Test ERROR:', error);
    }
  }
}

export default ConstraintTest;
