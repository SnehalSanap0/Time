import { Model, Document } from 'mongoose';
import { connectToMongoDB } from '../config/mongodb';
import {
  SubjectModel,
  FacultyModel,
  ClassroomModel,
  LabModel,
  TimetableSlotModel,
  SubjectDocument,
  FacultyDocument,
  ClassroomDocument,
  LabDocument,
  TimetableSlotDocument
} from '../models/schemas';
import { Subject, Faculty, Classroom, Lab, TimetableSlot } from '../types/timetable';

// Ensure MongoDB connection with better error handling
const ensureConnection = async () => {
  try {
    await connectToMongoDB();
  } catch (error) {
    console.error('MongoDB connection failed in service layer:', error);
    throw new Error('Database connection failed. Please check your MongoDB Atlas configuration.');
  }
};

// Generic MongoDB service class
export class MongoDBService<T extends Document, K> {
  constructor(private model: Model<T>) {}

  // Get all documents
  async getAll(): Promise<K[]> {
    try {
      await ensureConnection();
      const docs = await this.model.find().sort({ createdAt: -1 }).lean();
      return docs.map(doc => ({
        ...doc,
        id: doc._id?.toString() || '',
        _id: undefined
      })) as K[];
    } catch (error) {
      console.error(`Error fetching ${this.model.modelName}:`, error);
      throw error;
    }
  }

  // Get document by ID
  async getById(id: string): Promise<K | null> {
    try {
      await ensureConnection();
      const doc = await this.model.findById(id).lean();
      if (doc) {
        return {
          ...doc,
          id: doc._id?.toString() || '',
          _id: undefined
        } as K;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching ${this.model.modelName} by ID:`, error);
      throw error;
    }
  }

  // Add new document
  async add(data: Omit<K, 'id'>): Promise<string> {
    try {
      await ensureConnection();
      const doc = new this.model(data);
      const savedDoc = await doc.save();
      return String(savedDoc._id);
    } catch (error) {
      console.error(`Error adding ${this.model.modelName}:`, error);
      throw error;
    }
  }

  // Update document
  async update(id: string, data: Partial<Omit<K, 'id'>>): Promise<void> {
    try {
      await ensureConnection();
      await this.model.findByIdAndUpdate(id, data as Record<string, unknown>, { new: true });
    } catch (error) {
      console.error(`Error updating ${this.model.modelName}:`, error);
      throw error;
    }
  }

  // Delete document
  async delete(id: string): Promise<void> {
    try {
      await ensureConnection();
      await this.model.findByIdAndDelete(id);
    } catch (error) {
      console.error(`Error deleting ${this.model.modelName}:`, error);
      throw error;
    }
  }

  // Batch add multiple documents
  async batchAdd(items: Omit<K, 'id'>[]): Promise<void> {
    try {
      await ensureConnection();
      await this.model.insertMany(items);
    } catch (error) {
      console.error(`Error batch adding ${this.model.modelName}:`, error);
      throw error;
    }
  }

  // Real-time listener simulation (MongoDB doesn't have real-time like Firebase)
  // You can implement this using MongoDB Change Streams if needed
  onSnapshot(callback: (data: K[]) => void): () => void {
    const fetchData = async () => {
      try {
        const data = await this.getAll();
        callback(data);
      } catch (error) {
        console.error(`Error in ${this.model.modelName} snapshot:`, error);
      }
    };

    // Initial fetch
    fetchData();
    
    // Poll every 5 seconds (you can adjust this or implement change streams)
    const intervalId: NodeJS.Timeout = setInterval(fetchData, 5000);

    // Return cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }
}

// Specific service instances
export const subjectsService = new MongoDBService<SubjectDocument, Subject>(SubjectModel);
export const facultyService = new MongoDBService<FacultyDocument, Faculty>(FacultyModel);
export const classroomsService = new MongoDBService<ClassroomDocument, Classroom>(ClassroomModel);
export const laboratoriesService = new MongoDBService<LabDocument, Lab>(LabModel);
export const timetableSlotsService = new MongoDBService<TimetableSlotDocument, TimetableSlot>(TimetableSlotModel);

// Specialized timetable queries
export class TimetableService {
  // Get timetable slots by year
  static async getSlotsByYear(year: string): Promise<TimetableSlot[]> {
    try {
      await ensureConnection();
      const docs = await TimetableSlotModel.find({ year })
        .sort({ day: 1, time: 1 })
        .lean();
      return docs.map(doc => ({
        ...doc,
        id: doc._id?.toString() || '',
        _id: undefined
      })) as TimetableSlot[];
    } catch (error) {
      console.error('Error fetching timetable slots by year:', error);
      throw error;
    }
  }

  // Get timetable slots by faculty
  static async getSlotsByFaculty(faculty: string): Promise<TimetableSlot[]> {
    try {
      await ensureConnection();
      const docs = await TimetableSlotModel.find({ faculty })
        .sort({ day: 1, time: 1 })
        .lean();
      return docs.map(doc => ({
        ...doc,
        id: doc._id?.toString() || '',
        _id: undefined
      })) as TimetableSlot[];
    } catch (error) {
      console.error('Error fetching timetable slots by faculty:', error);
      throw error;
    }
  }

  // Clear all timetable slots
  static async clearAllSlots(): Promise<void> {
    try {
      await ensureConnection();
      await TimetableSlotModel.deleteMany({});
    } catch (error) {
      console.error('Error clearing timetable slots:', error);
      throw error;
    }
  }

  static async saveTimetableSlot(slot: Omit<TimetableSlot, 'id'>): Promise<string> {
    try {
      await ensureConnection();
      const doc = new TimetableSlotModel(slot);
      const savedDoc = await doc.save();
      return String(savedDoc._id);
    } catch (error) {
      console.error('Error saving timetable slot:', error);
      throw error;
    }
  }

  // Batch save multiple timetable slots
  static async batchSaveTimetableSlots(slots: Omit<TimetableSlot, 'id'>[]): Promise<void> {
    try {
      await ensureConnection();
      await TimetableSlotModel.insertMany(slots);
    } catch (error) {
      console.error('Error batch saving timetable slots:', error);
      throw error;
    }
  }

  // Get timetable slots by year and semester
  static async getSlotsByYearAndSemester(year: string, semester: number): Promise<TimetableSlot[]> {
    try {
      await ensureConnection();
      const docs = await TimetableSlotModel.find({ year, semester })
        .sort({ day: 1, time: 1 })
        .lean();
      return docs.map(doc => ({
        ...doc,
        id: doc._id?.toString() || '',
        _id: undefined
      })) as TimetableSlot[];
    } catch (error) {
      console.error('Error fetching timetable slots by year and semester:', error);
      throw error;
    }
  }

  // Get timetable slots by year, semester and batch
  static async getSlotsByYearSemesterAndBatch(year: string, semester: number, batch?: string): Promise<TimetableSlot[]> {
    try {
      await ensureConnection();
      const query: Record<string, unknown> = { year, semester };
      
      if (batch) {
        query.batch = batch;
      } else {
        // For theory classes (no batch filter)
        query.type = 'theory';
      }
      
      const docs = await TimetableSlotModel.find(query)
        .sort({ day: 1, time: 1 })
        .lean();
      return docs.map(doc => ({
        ...doc,
        id: doc._id?.toString() || '',
        _id: undefined
      })) as TimetableSlot[];
    } catch (error) {
      console.error('Error fetching timetable slots by year, semester and batch:', error);
      throw error;
    }
  }
}

// Data initialization service
export class DataInitializationService {
  static async initializeSampleData(): Promise<void> {
    try {
      await ensureConnection();
      
      // Check if data already exists
      const subjects = await subjectsService.getAll();
      if (subjects.length > 0) {
        console.log('Sample data already exists');
        return;
      }

      // Initialize sample subjects
      const sampleSubjects: Omit<Subject, 'id'>[] = [
        {
          name: 'Database Management Systems',
          code: 'DBMS',
          year: 'TE',
          theoryHours: 3,
          labHours: 2,
          faculty: 'Dr. Sharma',
          semester: 3,
        },
        {
          name: 'Software Engineering',
          code: 'SE',
          year: 'TE',
          theoryHours: 4,
          labHours: 2,
          faculty: 'Prof. Patel',
          semester: 3,
        },
        {
          name: 'Machine Learning',
          code: 'ML',
          year: 'BE',
          theoryHours: 3,
          labHours: 4,
          faculty: 'Dr. Kumar',
          semester: 7,
        },
      ];

      // Initialize sample faculty
      const sampleFaculty: Omit<Faculty, 'id'>[] = [
        {
          name: 'Dr. Sharma',
          email: 'dr.sharma@college.edu',
          phone: '+91 9876543210',
          department: 'Computer Engineering',
          subjects: ['DBMS', 'Data Structures'],
          maxHoursPerDay: 4,
          preferredSlots: ['Morning'],
        },
        {
          name: 'Prof. Patel',
          email: 'prof.patel@college.edu',
          phone: '+91 9876543211',
          department: 'Computer Engineering',
          subjects: ['Software Engineering', 'Web Development'],
          maxHoursPerDay: 5,
          preferredSlots: ['Morning', 'Afternoon'],
        },
        {
          name: 'Dr. Kumar',
          email: 'dr.kumar@college.edu',
          phone: '+91 9876543212',
          department: 'Computer Engineering',
          subjects: ['Machine Learning', 'AI'],
          maxHoursPerDay: 4,
          preferredSlots: ['Afternoon'],
        },
      ];

      // Initialize sample classrooms
      const sampleClassrooms: Omit<Classroom, 'id'>[] = [
        {
          name: 'Room A-101',
          capacity: 90,
          timeSlot: '8AM-3PM',
          assignedYear: 'SE',
          floor: 1,
          amenities: ['Projector', 'AC', 'Audio System'],
        },
        {
          name: 'Room A-102',
          capacity: 90,
          timeSlot: '8AM-3PM',
          assignedYear: 'TE',
          floor: 1,
          amenities: ['Projector', 'AC', 'Audio System'],
        },
        {
          name: 'Room A-103',
          capacity: 90,
          timeSlot: '8AM-3PM',
          assignedYear: 'BE',
          floor: 1,
          amenities: ['Projector', 'AC', 'Audio System'],
        },
      ];

      // Initialize sample labs
      const sampleLabs: Omit<Lab, 'id'>[] = [
        {
          name: 'Programming Lab 1',
          capacity: 30,
          type: 'Computer Lab',
          equipment: ['30 PCs', 'Projector', 'AC'],
          floor: 1,
          availableHours: ['1:15-3:15', '3:15-5:15'],
        },
        {
          name: 'Database Lab',
          capacity: 30,
          type: 'Specialized Lab',
          equipment: ['30 PCs', 'Server', 'Projector'],
          floor: 2,
          availableHours: ['1:15-3:15', '3:15-5:15'],
        },
        {
          name: 'AI/ML Lab',
          capacity: 30,
          type: 'Research Lab',
          equipment: ['High-end PCs', 'GPU Servers', 'Projector'],
          floor: 3,
          availableHours: ['1:15-3:15', '3:15-5:15'],
        },
      ];

      // Batch add all sample data
      await Promise.all([
        subjectsService.batchAdd(sampleSubjects),
        facultyService.batchAdd(sampleFaculty),
        classroomsService.batchAdd(sampleClassrooms),
        laboratoriesService.batchAdd(sampleLabs),
      ]);

      console.log('Sample data initialized successfully');
    } catch (error) {
      console.error('Error initializing sample data:', error);
      throw error;
    }
  }
}
