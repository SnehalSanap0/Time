import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://bridgelinksih_db_user:ijCEydkSfKqE09wz@bridgelink.zbdt3ld.mongodb.net/timetable_db?retryWrites=true&w=majority&appName=BridgeLink';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas successfully');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:', error);
  });

// Schemas
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

// Models
const Subject = mongoose.model('Subject', subjectSchema);
const Faculty = mongoose.model('Faculty', facultySchema);
const Classroom = mongoose.model('Classroom', classroomSchema);
const Lab = mongoose.model('Lab', labSchema);
const TimetableSlot = mongoose.model('TimetableSlot', timetableSlotSchema);

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Timetable API is running', database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected' });
});

// Subjects routes
app.get('/api/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ createdAt: -1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/subjects', async (req, res) => {
  try {
    const subject = new Subject(req.body);
    const savedSubject = await subject.save();
    res.status(201).json(savedSubject);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/subjects/:id', async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json(subject);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/subjects/:id', async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Faculty routes
app.get('/api/faculty', async (req, res) => {
  try {
    const faculty = await Faculty.find().sort({ createdAt: -1 });
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/faculty', async (req, res) => {
  try {
    const faculty = new Faculty(req.body);
    const savedFaculty = await faculty.save();
    res.status(201).json(savedFaculty);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/faculty/:id', async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
    res.json(faculty);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/faculty/:id', async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
    res.json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Classrooms routes
app.get('/api/classrooms', async (req, res) => {
  try {
    const classrooms = await Classroom.find().sort({ createdAt: -1 });
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/classrooms', async (req, res) => {
  try {
    const classroom = new Classroom(req.body);
    const savedClassroom = await classroom.save();
    res.status(201).json(savedClassroom);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/classrooms/:id', async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!classroom) return res.status(404).json({ error: 'Classroom not found' });
    res.json(classroom);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/classrooms/:id', async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndDelete(req.params.id);
    if (!classroom) return res.status(404).json({ error: 'Classroom not found' });
    res.json({ message: 'Classroom deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Labs routes
app.get('/api/labs', async (req, res) => {
  try {
    const labs = await Lab.find().sort({ createdAt: -1 });
    res.json(labs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/labs', async (req, res) => {
  try {
    const lab = new Lab(req.body);
    const savedLab = await lab.save();
    res.status(201).json(savedLab);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/labs/:id', async (req, res) => {
  try {
    const lab = await Lab.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lab) return res.status(404).json({ error: 'Lab not found' });
    res.json(lab);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/labs/:id', async (req, res) => {
  try {
    const lab = await Lab.findByIdAndDelete(req.params.id);
    if (!lab) return res.status(404).json({ error: 'Lab not found' });
    res.json({ message: 'Lab deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Timetable slots routes
app.get('/api/timetable-slots', async (req, res) => {
  try {
    const { year, semester, faculty, batch } = req.query;
    let query = {};
    
    if (year) query.year = year;
    if (semester) query.semester = parseInt(semester);
    if (faculty) query.faculty = faculty;
    if (batch) query.batch = batch;
    
    const slots = await TimetableSlot.find(query).sort({ day: 1, time: 1 });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/timetable-slots', async (req, res) => {
  try {
    const slot = new TimetableSlot(req.body);
    const savedSlot = await slot.save();
    res.status(201).json(savedSlot);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/timetable-slots/batch', async (req, res) => {
  try {
    const slots = await TimetableSlot.insertMany(req.body);
    res.status(201).json(slots);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/timetable-slots', async (req, res) => {
  try {
    await TimetableSlot.deleteMany({});
    res.json({ message: 'All timetable slots cleared successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/timetable-slots/:id', async (req, res) => {
  try {
    const slot = await TimetableSlot.findByIdAndDelete(req.params.id);
    if (!slot) return res.status(404).json({ error: 'Timetable slot not found' });
    res.json({ message: 'Timetable slot deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Initialize sample data
app.post('/api/initialize-data', async (req, res) => {
  try {
    // Check if data already exists
    const existingSubjects = await Subject.countDocuments();
    if (existingSubjects > 0) {
      return res.json({ message: 'Sample data already exists' });
    }

    // Sample data
    const sampleSubjects = [
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

    const sampleFaculty = [
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

    const sampleClassrooms = [
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

    const sampleLabs = [
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

    // Insert sample data
    await Subject.insertMany(sampleSubjects);
    await Faculty.insertMany(sampleFaculty);
    await Classroom.insertMany(sampleClassrooms);
    await Lab.insertMany(sampleLabs);

    res.json({ message: 'Sample data initialized successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
});
