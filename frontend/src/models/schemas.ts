import mongoose, { Schema, Document } from 'mongoose';
import { Subject, Faculty, Classroom, Lab, TimetableSlot } from '../types/timetable';

// Extend interfaces to include MongoDB Document properties
export interface SubjectDocument extends Omit<Subject, 'id'>, Document {}
export interface FacultyDocument extends Omit<Faculty, 'id'>, Document {}
export interface ClassroomDocument extends Omit<Classroom, 'id'>, Document {}
export interface LabDocument extends Omit<Lab, 'id'>, Document {}
export interface TimetableSlotDocument extends Omit<TimetableSlot, 'id'>, Document {}

// Subject Schema
const subjectSchema = new Schema<SubjectDocument>({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  year: { type: String, enum: ['SE', 'TE', 'BE'], required: true },
  theoryHours: { type: Number, required: true },
  labHours: { type: Number, required: true },
  faculty: { type: String, required: true },
  semester: { type: Number, required: true }
}, {
  timestamps: true
});

// Faculty Schema
const facultySchema = new Schema<FacultyDocument>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  department: { type: String, required: true },
  subjects: [{ type: String }],
  maxHoursPerDay: { type: Number, required: true },
  preferredSlots: [{ type: String }],
  unavailableSlots: [{ type: String }]
}, {
  timestamps: true
});

// Classroom Schema
const classroomSchema = new Schema<ClassroomDocument>({
  name: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  timeSlot: { type: String, enum: ['8AM-3PM', '10AM-5PM'], required: true },
  assignedYear: { type: String, enum: ['SE', 'TE', 'BE'], required: true },
  floor: { type: Number, required: true },
  amenities: [{ type: String }]
}, {
  timestamps: true
});

// Lab Schema
const labSchema = new Schema<LabDocument>({
  name: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  type: { type: String, required: true },
  equipment: [{ type: String }],
  floor: { type: Number, required: true },
  availableHours: [{ type: String }],
  compatibleSubjects: [{ type: String }]
}, {
  timestamps: true
});

// TimetableSlot Schema
const timetableSlotSchema = new Schema<TimetableSlotDocument>({
  day: { type: String, required: true },
  time: { type: String, required: true },
  subject: { type: String, required: true },
  faculty: { type: String, required: true },
  room: { type: String, required: true },
  type: { type: String, enum: ['theory', 'lab'], required: true },
  year: { type: String, enum: ['SE', 'TE', 'BE'], required: true },
  batch: { type: String, enum: ['A', 'B', 'C'] },
  duration: { type: Number, required: true },
  semester: { type: Number, required: true }
}, {
  timestamps: true
});

// Create indexes for better query performance
subjectSchema.index({ year: 1, semester: 1 });
facultySchema.index({ department: 1 });
classroomSchema.index({ assignedYear: 1 });
timetableSlotSchema.index({ year: 1, semester: 1, day: 1, time: 1 });
timetableSlotSchema.index({ faculty: 1 });

// Export models
export const SubjectModel = mongoose.model<SubjectDocument>('Subject', subjectSchema);
export const FacultyModel = mongoose.model<FacultyDocument>('Faculty', facultySchema);
export const ClassroomModel = mongoose.model<ClassroomDocument>('Classroom', classroomSchema);
export const LabModel = mongoose.model<LabDocument>('Lab', labSchema);
export const TimetableSlotModel = mongoose.model<TimetableSlotDocument>('TimetableSlot', timetableSlotSchema);
