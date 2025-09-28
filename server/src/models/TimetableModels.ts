import mongoose from 'mongoose';

// --- SCHEMAS ---

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  year: { type: String, enum: ['SE', 'TE', 'BE'], required: true },
  theoryHours: { type: Number, required: true },
  labHours: { type: Number, required: true },
  faculty: { type: String, required: true },
  semester: { type: Number, required: true }
}, { timestamps: true });

const facultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  department: { type: String, required: true },
  subjects: [{ type: String }],
  maxHoursPerDay: { type: Number, required: true },
  preferredSlots: [{ type: String }],
  unavailableSlots: [{ type: String }]
}, { timestamps: true });

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  timeSlot: { type: String, enum: ['8AM-3PM', '10AM-5PM'], required: true },
  assignedYear: { type: String, enum: ['SE', 'TE', 'BE'], required: true },
  floor: { type: Number, required: true },
  amenities: [{ type: String }]
}, { timestamps: true });

const labSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  type: { type: String, required: true },
  equipment: [{ type: String }],
  floor: { type: Number, required: true },
  availableHours: [{ type: String }]
}, { timestamps: true });

const timetableSlotSchema = new mongoose.Schema({
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
}, { timestamps: true });


// --- MODELS ---

export const SubjectModel = mongoose.model('Subject', subjectSchema);
export const FacultyModel = mongoose.model('Faculty', facultySchema);
export const ClassroomModel = mongoose.model('Classroom', classroomSchema);
export const LabModel = mongoose.model('Lab', labSchema);
export const TimetableSlotModel = mongoose.model('TimetableSlot', timetableSlotSchema);
