import { AITimetableGenerator } from './aiTimetableGenerator';
import { Subject, Faculty, Classroom, Lab, TimetableConstraints } from '../types/timetable';

/**
 * Test utility to verify consistent timetable generation
 */
export class ConsistencyTest {
  /**
   * Test that identical inputs produce identical outputs
   */
  public static async testConsistency(): Promise<{
    isConsistent: boolean;
    hash1: string;
    hash2: string;
    differences: string[];
  }> {
    // Create test data
    const testData = this.createTestData();
    
    // Generate timetable twice with identical inputs
    const generator1 = new AITimetableGenerator(
      testData.subjects,
      testData.faculty,
      testData.classrooms,
      testData.labs,
      testData.constraints
    );
    
    const generator2 = new AITimetableGenerator(
      testData.subjects,
      testData.faculty,
      testData.classrooms,
      testData.labs,
      testData.constraints
    );
    
    const result1 = await generator1.generateTimetable('SE', 3);
    const result2 = await generator2.generateTimetable('SE', 3);
    
    // Compare consistency hashes
    const hash1 = result1.generationStats.consistencyHash;
    const hash2 = result2.generationStats.consistencyHash;
    const isConsistent = hash1 === hash2;
    
    // Find differences if any
    const differences: string[] = [];
    if (!isConsistent) {
      differences.push('Consistency hashes do not match');
      
      // Compare slot counts
      if (result1.slots.length !== result2.slots.length) {
        differences.push(`Slot count differs: ${result1.slots.length} vs ${result2.slots.length}`);
      }
      
      // Compare constraint scores
      if (result1.analysisResult.constraintScore !== result2.analysisResult.constraintScore) {
        differences.push(`Constraint scores differ: ${result1.analysisResult.constraintScore} vs ${result2.analysisResult.constraintScore}`);
      }
    }
    
    return {
      isConsistent,
      hash1,
      hash2,
      differences
    };
  }
  
  /**
   * Create test data for consistency testing
   */
  private static createTestData(): {
    subjects: Subject[];
    faculty: Faculty[];
    classrooms: Classroom[];
    labs: Lab[];
    constraints: TimetableConstraints;
  } {
    const subjects: Subject[] = [
      {
        id: '1',
        name: 'Data Structures',
        code: 'DS',
        year: 'SE',
        theoryHours: 3,
        labHours: 2,
        faculty: 'Dr. Smith',
        semester: 3
      },
      {
        id: '2',
        name: 'Database Systems',
        code: 'DB',
        year: 'SE',
        theoryHours: 3,
        labHours: 2,
        faculty: 'Dr. Johnson',
        semester: 3
      },
      {
        id: '3',
        name: 'Computer Networks',
        code: 'CN',
        year: 'SE',
        theoryHours: 3,
        labHours: 2,
        faculty: 'Dr. Brown',
        semester: 3
      }
    ];
    
    const faculty: Faculty[] = [
      {
        id: '1',
        name: 'Dr. Smith',
        email: 'smith@university.edu',
        phone: '123-456-7890',
        department: 'Computer Science',
        subjects: ['DS'],
        maxHoursPerDay: 6,
        preferredSlots: ['Morning', 'Afternoon']
      },
      {
        id: '2',
        name: 'Dr. Johnson',
        email: 'johnson@university.edu',
        phone: '123-456-7891',
        department: 'Computer Science',
        subjects: ['DB'],
        maxHoursPerDay: 6,
        preferredSlots: ['Morning']
      },
      {
        id: '3',
        name: 'Dr. Brown',
        email: 'brown@university.edu',
        phone: '123-456-7892',
        department: 'Computer Science',
        subjects: ['CN'],
        maxHoursPerDay: 6,
        preferredSlots: ['Afternoon']
      }
    ];
    
    const classrooms: Classroom[] = [
      {
        id: '1',
        name: 'CS-101',
        capacity: 60,
        timeSlot: '8AM-3PM',
        assignedYear: 'SE',
        floor: 1,
        amenities: ['Projector', 'Whiteboard']
      }
    ];
    
    const labs: Lab[] = [
      {
        id: '1',
        name: 'CS-Lab-1',
        capacity: 30,
        type: 'Computer Lab',
        equipment: ['Computers', 'Network Equipment'],
        floor: 1,
        availableHours: ['1:15-3:15', '3:15-5:15'],
        compatibleSubjects: ['DS', 'DB', 'CN']
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
   * Run a comprehensive consistency test
   */
  public static async runComprehensiveTest(): Promise<void> {
    console.log('🧪 Running Consistency Test...');
    
    try {
      const result = await this.testConsistency();
      
      if (result.isConsistent) {
        console.log('✅ Consistency Test PASSED');
        console.log(`📊 Hash: ${result.hash1.substring(0, 16)}...`);
      } else {
        console.log('❌ Consistency Test FAILED');
        console.log('🔍 Differences found:');
        result.differences.forEach(diff => console.log(`  - ${diff}`));
        console.log(`📊 Hash 1: ${result.hash1.substring(0, 16)}...`);
        console.log(`📊 Hash 2: ${result.hash2.substring(0, 16)}...`);
      }
    } catch (error) {
      console.error('❌ Consistency Test ERROR:', error);
    }
  }
}

// Export for use in development/testing
export default ConsistencyTest;
