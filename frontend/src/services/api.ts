import { Subject, Faculty, Classroom, Lab, TimetableSlot } from '../types/timetable';

const API_BASE_URL = 'http://localhost:5000/api';

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
export const subjectsService = new ApiService<Subject>('subjects');
export const facultyService = new ApiService<Faculty>('faculty');
export const classroomsService = new ApiService<Classroom>('classrooms');
export const laboratoriesService = new ApiService<Lab>('labs');
export const timetableSlotsService = new ApiService<TimetableSlot>('timetable-slots');

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
