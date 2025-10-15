import { Subject, Faculty, Classroom, Lab, TimetableSlot, ScheduledHour } from '../types/timetable';

const API_BASE_URL = 'http://localhost:3001/api';

// Generic API service class
class ApiService<T extends { id?: string }> {
  constructor(private endpoint: string) {}

  async getAll(): Promise<T[]> {
    const response = await fetch(`${API_BASE_URL}/${this.endpoint}`);
    if (!response.ok) throw new Error(`Failed to fetch ${this.endpoint}`);
    const data = await response.json();
    return data.map((item: any) => ({ ...item, id: item._id }));
  }

  async getById(id: string): Promise<T | null> {
    const response = await fetch(`${API_BASE_URL}/${this.endpoint}/${id}`);
    if (!response.ok) return null;
    const data = await response.json();
    return { ...data, id: data._id };
  }

  async add(data: Omit<T, 'id'>): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/${this.endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to add ${this.endpoint}`);
    const result = await response.json();
    return result._id;
  }

  async update(id: string, data: Partial<Omit<T, 'id'>>): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${this.endpoint}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to update ${this.endpoint}`);
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${this.endpoint}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Failed to delete ${this.endpoint}`);
  }

  async batchAdd(items: Omit<T, 'id'>[]): Promise<void> {
    for (const item of items) {
      await this.add(item);
    }
  }

  onSnapshot(callback: (data: T[]) => void): () => void {
    const fetchData = async () => {
      try {
        const data = await this.getAll();
        callback(data);
      } catch (error) {
        console.error(`Error in ${this.endpoint} snapshot:`, error);
      }
    };

    // Initial fetch
    fetchData();
    
    // Poll every 3 seconds for changes
    const intervalId = setInterval(fetchData, 3000);

    return () => {
      clearInterval(intervalId);
    };
  }
}

// Service instances
export const subjectsService = new class extends ApiService<Subject> {
  constructor() { super('subjects'); }
  
  async getBySemester(semester: number): Promise<Subject[]> {
    const response = await fetch(`${API_BASE_URL}/subjects?semester=${semester}`);
    if (!response.ok) throw new Error('Failed to fetch subjects by semester');
    const data = await response.json();
    return data.map((item: any) => ({ ...item, id: item._id }));
  }

  async getByDepartment(department: string): Promise<Subject[]> {
    const response = await fetch(`${API_BASE_URL}/subjects?department=${encodeURIComponent(department)}`);
    if (!response.ok) throw new Error('Failed to fetch subjects by department');
    const data = await response.json();
    return data.map((item: any) => ({ ...item, id: item._id }));
  }

  async getByFaculty(facultyId: string): Promise<Subject[]> {
    const response = await fetch(`${API_BASE_URL}/subjects?facultyId=${facultyId}`);
    if (!response.ok) throw new Error('Failed to fetch subjects by faculty');
    const data = await response.json();
    return data.map((item: any) => ({ ...item, id: item._id }));
  }
}();

export const facultyService = new class extends ApiService<Faculty> {
  constructor() { super('faculty'); }
  
  async getByDepartment(department: string): Promise<Faculty[]> {
    const response = await fetch(`${API_BASE_URL}/faculty?department=${encodeURIComponent(department)}`);
    if (!response.ok) throw new Error('Failed to fetch faculty by department');
    const data = await response.json();
    return data.map((item: any) => ({ ...item, id: item._id }));
  }

  async getAvailableFaculty(slot: Omit<TimetableSlot, 'id' | 'facultyId'>): Promise<Faculty[]> {
    const response = await fetch(`${API_BASE_URL}/faculty/available`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slot)
    });
    if (!response.ok) throw new Error('Failed to fetch available faculty');
    const data = await response.json();
    return data.map((item: any) => ({ ...item, id: item._id }));
  }
}();

export const classroomsService = new class extends ApiService<Classroom> {
  constructor() { super('classrooms'); }
  
  async getAvailableRooms(slot: Omit<TimetableSlot, 'id' | 'roomId'>): Promise<Classroom[]> {
    const response = await fetch(`${API_BASE_URL}/classrooms/available`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slot)
    });
    if (!response.ok) throw new Error('Failed to fetch available classrooms');
    const data = await response.json();
    return data.map((item: any) => ({ ...item, id: item._id }));
  }
}();

export const laboratoriesService = new class extends ApiService<Lab> {
  constructor() { super('labs'); }
  
  async getAvailableLabs(slot: Omit<TimetableSlot, 'id' | 'labId'>): Promise<Lab[]> {
    const response = await fetch(`${API_BASE_URL}/labs/available`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slot)
    });
    if (!response.ok) throw new Error('Failed to fetch available labs');
    const data = await response.json();
    return data.map((item: any) => ({ ...item, id: item._id }));
  }
}();

export const timetableSlotsService = new class extends ApiService<TimetableSlot> {
  constructor() { super('timetable-slots'); }
  
  async getByFilters(filters: {
    year?: string;
    semester?: number;
    batch?: string;
    day?: string;
    facultyId?: string;
    subjectId?: string;
  }): Promise<TimetableSlot[]> {
    const params = new URLSearchParams();
    if (filters.year) params.append('year', filters.year);
    if (filters.semester) params.append('semester', filters.semester.toString());
    if (filters.batch) params.append('batch', filters.batch);
    if (filters.day) params.append('day', filters.day);
    if (filters.facultyId) params.append('facultyId', filters.facultyId);
    if (filters.subjectId) params.append('subjectId', filters.subjectId);
    
    const response = await fetch(`${API_BASE_URL}/timetable-slots?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch timetable slots with filters');
    const data = await response.json();
    return data.map((item: any) => ({ ...item, id: item._id }));
  }
}();

export const scheduledHoursService = new class extends ApiService<ScheduledHour> {
  constructor() { super('scheduled-hours'); }
  
  async getBySubject(subjectId: string): Promise<ScheduledHour[]> {
    const response = await fetch(`${API_BASE_URL}/scheduled-hours?subjectId=${subjectId}`);
    if (!response.ok) throw new Error('Failed to fetch scheduled hours by subject');
    const data = await response.json();
    return data.map((item: any) => ({ ...item, id: item._id }));
  }
  
  async getByFaculty(facultyId: string): Promise<ScheduledHour[]> {
    const response = await fetch(`${API_BASE_URL}/scheduled-hours?facultyId=${facultyId}`);
    if (!response.ok) throw new Error('Failed to fetch scheduled hours by faculty');
    const data = await response.json();
    return data.map((item: any) => ({ ...item, id: item._id }));
  }
  
  async getByBatch(batch: string): Promise<ScheduledHour[]> {
    const response = await fetch(`${API_BASE_URL}/scheduled-hours?batch=${encodeURIComponent(batch)}`);
    if (!response.ok) throw new Error('Failed to fetch scheduled hours by batch');
    const data = await response.json();
    return data.map((item: any) => ({ ...item, id: item._id }));
  }
  
  async getRemainingHours(subjectId: string, batch: string): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/scheduled-hours/remaining?subjectId=${subjectId}&batch=${encodeURIComponent(batch)}`);
    if (!response.ok) throw new Error('Failed to fetch remaining scheduled hours');
    const data = await response.json();
    return data.remainingHours;
  }
}();

// Timetable Service
export class TimetableService {
  static async getSlotsByYear(year: string): Promise<TimetableSlot[]> {
    const response = await fetch(`${API_BASE_URL}/timetable-slots?year=${year}`);
    if (!response.ok) throw new Error('Failed to fetch timetable slots by year');
    const data = await response.json();
    return data.map((item: any) => ({ ...item, id: item._id }));
  }

  static async getSlotsByFaculty(faculty: string): Promise<TimetableSlot[]> {
    const response = await fetch(`${API_BASE_URL}/timetable-slots?faculty=${encodeURIComponent(faculty)}`);
    if (!response.ok) throw new Error('Failed to fetch timetable slots by faculty');
    const data = await response.json();
    return data.map((item: any) => ({ ...item, id: item._id }));
  }

  static async clearAllSlots(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/timetable-slots`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to clear timetable slots');
  }

  static async saveTimetableSlot(slot: Omit<TimetableSlot, 'id'>): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/timetable-slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slot),
    });
    if (!response.ok) throw new Error('Failed to save timetable slot');
    const result = await response.json();
    return result._id;
  }

  static async batchSaveTimetableSlots(slots: Omit<TimetableSlot, 'id'>[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/timetable-slots/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slots),
    });
    if (!response.ok) throw new Error('Failed to batch save timetable slots');
  }

  static async getSlotsByYearAndSemester(year: string, semester: number): Promise<TimetableSlot[]> {
    const response = await fetch(`${API_BASE_URL}/timetable-slots?year=${year}&semester=${semester}`);
    if (!response.ok) throw new Error('Failed to fetch timetable slots by year and semester');
    const data = await response.json();
    return data.map((item: any) => ({ ...item, id: item._id }));
  }

  static async getSlotsByYearSemesterAndBatch(year: string, semester: number, batch?: string): Promise<TimetableSlot[]> {
    let url = `${API_BASE_URL}/timetable-slots?year=${year}&semester=${semester}`;
    if (batch) {
      url += `&batch=${batch}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch timetable slots');
    const data = await response.json();
    return data.map((item: any) => ({ ...item, id: item._id }));
  }
}

// Data Initialization Service
export class DataInitializationService {
  static async initializeSampleData(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/initialize-data`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to initialize sample data');
      const result = await response.json();
      console.log('✅', result.message);
    } catch (error) {
      console.error('Error initializing sample data:', error);
      throw error;
    }
  }
}

// Health check
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
};
