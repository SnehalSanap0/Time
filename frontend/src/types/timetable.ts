export interface Subject {
  id: string;
  name: string;
  code: string;
  year: 'SE' | 'TE' | 'BE';
  theoryHours: number;
  labHours: number;
  faculty: string | { _id: string; name: string; email: string; department: string };
  semester: number;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  subjects: string[];
  maxHoursPerDay: number;
  preferredSlots: string[];
  unavailableSlots?: string[];
}

export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  timeSlot: '8AM-3PM' | '10AM-5PM';
  assignedYear: 'SE' | 'TE' | 'BE';
  floor: number;
  amenities: string[];
}

export interface Lab {
  id: string;
  name: string;
  capacity: number;
  type: string;
  equipment: string[];
  floor: number;
  availableHours: string[];
  compatibleSubjects: string[];
}

export interface TimetableSlot {
  id: string;
  day: string;
  time: string;
  subject: string;
  faculty: string;
  room: string;
  type: 'theory' | 'lab';
  year: 'SE' | 'TE' | 'BE';
  batch?: 'A' | 'B' | 'C';
  duration: number; // in hours
  semester: number; // Add this field to track which semester the slot belongs to
}

export interface Constraint {
  id: string;
  type: 'hard' | 'soft';
  description: string;
  weight: number;
}

export interface TimetableConstraints {
  maxHoursPerDay: number;
  minBreakBetweenClasses: number;
  maxConsecutiveHours: number;
  prioritizeLabAfternoon: boolean;
  allowBackToBackTheory: boolean;
  facultyRestSlots: number;
  yearBatchType?: {
    SE: 'Morning' | 'Afternoon';
    TE: 'Morning' | 'Afternoon';
    BE: 'Morning' | 'Afternoon';
  };
}

export interface GenerationResult {
  success: boolean;
  conflicts: Conflict[];
  statistics: {
    totalSlots: number;
    utilizationRate: number;
    facultyWorkload: number;
    labUtilization: number;
  };
}

export interface Conflict {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  severity: 'low' | 'medium' | 'high';
  affectedEntities: string[];
}