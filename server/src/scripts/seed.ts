import mongoose from 'mongoose';
import { SubjectModel, FacultyModel, ClassroomModel, LabModel, TimetableSlotModel } from '../models/TimetableModels';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://bridgelinksih_db_user:ijCEydkSfKqE09wz@bridgelink.zbdt3ld.mongodb.net/timetable_db?retryWrites=true&w=majority&appName=BridgeLink';

// --- HUGE DATASET FOR ROBUST TESTING ---

const subjects = [
    // --- SECOND YEAR (SE) ---
    // SEM 3
    { name: 'Data Structures & Algorithms', code: 'SE301', year: 'SE', theoryHours: 4, labHours: 4, faculty: 'Dr. Evelyn Reed', semester: 3 },
    { name: 'Discrete Mathematics', code: 'SE302', year: 'SE', theoryHours: 4, labHours: 0, faculty: 'Prof. Samuel Tan', semester: 3 },
    { name: 'Object Oriented Programming', code: 'SE303', year: 'SE', theoryHours: 3, labHours: 4, faculty: 'Dr. Aisha Khan', semester: 3 },
    { name: 'Digital Logic & Design', code: 'SE304', year: 'SE', theoryHours: 3, labHours: 2, faculty: 'Prof. Ben Carter', semester: 3 },
    { name: 'Computer Graphics', code: 'SE305', year: 'SE', theoryHours: 3, labHours: 2, faculty: 'Prof. Laura Bailey', semester: 3 },
    { name: 'Human-Computer Interaction', code: 'SE306', year: 'SE', theoryHours: 3, labHours: 0, faculty: 'Dr. Marcus Chen', semester: 3 },
    // SEM 4
    { name: 'Analysis of Algorithms', code: 'SE401', year: 'SE', theoryHours: 4, labHours: 2, faculty: 'Dr. Evelyn Reed', semester: 4 },
    { name: 'Microprocessors & Interfacing', code: 'SE402', year: 'SE', theoryHours: 3, labHours: 2, faculty: 'Prof. Ben Carter', semester: 4 },
    { name: 'Operating Systems', code: 'SE403', year: 'SE', theoryHours: 4, labHours: 2, faculty: 'Dr. Kenji Tanaka', semester: 4 },
    { name: 'Probability & Statistics', code: 'SE404', year: 'SE', theoryHours: 4, labHours: 0, faculty: 'Prof. Samuel Tan', semester: 4 },
    { name: 'Data Communications', code: 'SE405', year: 'SE', theoryHours: 3, labHours: 0, faculty: 'Dr. Aisha Khan', semester: 4 },


    // --- THIRD YEAR (TE) ---
    // SEM 5
    { name: 'Database Management Systems', code: 'TE501', year: 'TE', theoryHours: 4, labHours: 2, faculty: 'Dr. Aisha Khan', semester: 5 },
    { name: 'Theory of Computation', code: 'TE502', year: 'TE', theoryHours: 3, labHours: 0, faculty: 'Prof. Samuel Tan', semester: 5 },
    { name: 'Software Engineering', code: 'TE503', year: 'TE', theoryHours: 3, labHours: 2, faculty: 'Dr. Marcus Chen', semester: 5 },
    { name: 'Computer Networks', code: 'TE504', year: 'TE', theoryHours: 4, labHours: 2, faculty: 'Dr. Kenji Tanaka', semester: 5 },
    { name: 'Web Technology', code: 'TE505', year: 'TE', theoryHours: 2, labHours: 4, faculty: 'Prof. Laura Bailey', semester: 5 },
    { name: 'Embedded Systems', code: 'TE506', year: 'TE', theoryHours: 3, labHours: 2, faculty: 'Prof. Ben Carter', semester: 5 },
    // SEM 6
    { name: 'Advanced Databases', code: 'TE601', year: 'TE', theoryHours: 3, labHours: 2, faculty: 'Dr. Aisha Khan', semester: 6 },
    { name: 'Compiler Design', code: 'TE602', year: 'TE', theoryHours: 4, labHours: 2, faculty: 'Dr. Evelyn Reed', semester: 6 },
    { name: 'Cryptography', code: 'TE603', year: 'TE', theoryHours: 4, labHours: 0, faculty: 'Dr. Kenji Tanaka', semester: 6 },
    { name: 'Mobile Application Development', code: 'TE604', year: 'TE', theoryHours: 2, labHours: 4, faculty: 'Prof. Laura Bailey', semester: 6 },
    { name: 'Software Testing & QA', code: 'TE605', year: 'TE', theoryHours: 3, labHours: 2, faculty: 'Dr. Marcus Chen', semester: 6 },


    // --- FINAL YEAR (BE) ---
    // SEM 7
    { name: 'Machine Learning', code: 'BE701', year: 'BE', theoryHours: 4, labHours: 4, faculty: 'Dr. Evelyn Reed', semester: 7 },
    { name: 'Information & Cyber Security', code: 'BE702', year: 'BE', theoryHours: 4, labHours: 2, faculty: 'Dr. Kenji Tanaka', semester: 7 },
    { name: 'Cloud Computing', code: 'BE703', year: 'BE', theoryHours: 3, labHours: 2, faculty: 'Dr. Marcus Chen', semester: 7 },
    { name: 'High Performance Computing', code: 'BE704', year: 'BE', theoryHours: 3, labHours: 2, faculty: 'Dr. Aisha Khan', semester: 7 },
    { name: 'Project Management', code: 'BE705', year: 'BE', theoryHours: 3, labHours: 0, faculty: 'Prof. Samuel Tan', semester: 7 },
    { name: 'Major Project - Phase 1', code: 'BE706', year: 'BE', theoryHours: 0, labHours: 6, faculty: 'Dr. Marcus Chen', semester: 7 },
    // SEM 8
    { name: 'Natural Language Processing', code: 'BE801', year: 'BE', theoryHours: 4, labHours: 2, faculty: 'Dr. Evelyn Reed', semester: 8 },
    { name: 'Blockchain Technology', code: 'BE802', year: 'BE', theoryHours: 3, labHours: 0, faculty: 'Dr. Kenji Tanaka', semester: 8 },
    { name: 'Software Defined Networks', code: 'BE803', year: 'BE', theoryHours: 3, labHours: 2, faculty: 'Dr. Aisha Khan', semester: 8 },
    { name: 'Business Intelligence', code: 'BE804', year: 'BE', theoryHours: 3, labHours: 2, faculty: 'Prof. Laura Bailey', semester: 8 },
    { name: 'Major Project - Phase 2', code: 'BE805', year: 'BE', theoryHours: 0, labHours: 8, faculty: 'Dr. Marcus Chen', semester: 8 },
];

const faculty = [
    { name: 'Dr. Evelyn Reed', email: 'evelyn.reed@example.com', phone: '123-456-7890', department: 'Computer Science', subjects: ['SE301', 'SE401', 'TE602', 'BE701', 'BE801'], maxHoursPerDay: 5, preferredSlots: ['Morning'], unavailableSlots: ['Friday Afternoon'] },
    { name: 'Prof. Samuel Tan', email: 'samuel.tan@example.com', phone: '123-456-7891', department: 'Mathematics', subjects: ['SE302', 'SE404', 'TE502', 'BE705'], maxHoursPerDay: 6, preferredSlots: [], unavailableSlots: [] },
    { name: 'Dr. Aisha Khan', email: 'aisha.khan@example.com', phone: '123-456-7892', department: 'Computer Science', subjects: ['SE303', 'SE405', 'TE501', 'TE601', 'BE704', 'BE803'], maxHoursPerDay: 4, preferredSlots: ['Afternoon'], unavailableSlots: ['Monday Morning'] },
    { name: 'Prof. Ben Carter', email: 'ben.carter@example.com', phone: '123-456-7893', department: 'Electronics', subjects: ['SE304', 'SE402', 'TE506'], maxHoursPerDay: 5, preferredSlots: ['Morning', 'Afternoon'], unavailableSlots: ['Tuesday 3:15-5:15'] },
    { name: 'Dr. Marcus Chen', email: 'marcus.chen@example.com', phone: '123-456-7894', department: 'Computer Science', subjects: ['SE306', 'TE503', 'TE605', 'BE703', 'BE706', 'BE805'], maxHoursPerDay: 4, preferredSlots: [], unavailableSlots: ['Wednesday 1:15-3:15'] },
    { name: 'Prof. Laura Bailey', email: 'laura.bailey@example.com', phone: '123-456-7895', department: 'Information Technology', subjects: ['SE305', 'TE505', 'TE604', 'BE804'], maxHoursPerDay: 6, preferredSlots: ['Afternoon'], unavailableSlots: [] },
    { name: 'Dr. Kenji Tanaka', email: 'kenji.tanaka@example.com', phone: '123-456-7896', department: 'Computer Science', subjects: ['SE403', 'TE504', 'TE603', 'BE702', 'BE802'], maxHoursPerDay: 5, preferredSlots: ['Morning'], unavailableSlots: ['Thursday all day'] },
];

const classrooms = [
    // Two classrooms for SE (simulating two divisions)
    { name: 'CR-101A', capacity: 75, timeSlot: '8AM-3PM', assignedYear: 'SE', floor: 1, amenities: ['Projector', 'Whiteboard'] },
    { name: 'CR-101B', capacity: 75, timeSlot: '8AM-3PM', assignedYear: 'SE', floor: 1, amenities: ['Projector', 'Whiteboard'] },
    // Two classrooms for TE
    { name: 'CR-201A', capacity: 75, timeSlot: '10AM-5PM', assignedYear: 'TE', floor: 2, amenities: ['Projector', 'Smart Board'] },
    { name: 'CR-201B', capacity: 75, timeSlot: '10AM-5PM', assignedYear: 'TE', floor: 2, amenities: ['Projector', 'Smart Board'] },
    // Two classrooms for BE
    { name: 'CR-301A', capacity: 75, timeSlot: '8AM-3PM', assignedYear: 'BE', floor: 3, amenities: ['Projector', 'Whiteboard', 'Speakers'] },
    { name: 'CR-301B', capacity: 75, timeSlot: '8AM-3PM', assignedYear: 'BE', floor: 3, amenities: ['Projector', 'Whiteboard', 'Speakers'] },
];

const labs = [
    { name: 'Software Lab 1', capacity: 40, type: 'Software', equipment: ['Dev-PC-i7', 'Projector'], floor: 1, availableHours: ['1:15-3:15', '3:15-5:15'] },
    { name: 'Software Lab 2', capacity: 40, type: 'Software', equipment: ['Dev-PC-i5', 'Projector'], floor: 1, availableHours: ['1:15-3:15', '3:15-5:15'] },
    { name: 'Hardware Lab', capacity: 35, type: 'Hardware', equipment: ['Logic Gates Kit', 'Oscilloscope', 'Microprocessor Kits'], floor: 1, availableHours: ['1:15-3:15', '3:15-5:15'] },
    { name: 'Networking Lab', capacity: 35, type: 'Network', equipment: ['Routers', 'Switches', 'Cabling Tools', 'Packet Sniffers'], floor: 2, availableHours: ['1:15-3:15', '3:15-5:15'] },
    { name: 'AI/ML Lab', capacity: 30, type: 'High-Perf', equipment: ['GPU Servers', 'Dev-PC-i9'], floor: 3, availableHours: ['1:15-3:15', '3:15-5:15'] },
    { name: 'Project Lab', capacity: 40, type: 'General', equipment: ['Workbenches', 'Dev-PC', 'Soldering Stations'], floor: 3, availableHours: ['1:15-3:15', '3:15-5:15'] },
];


const seedDatabase = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB for seeding.');

        // Clear existing data
        console.log('Clearing old data...');
        await SubjectModel.deleteMany({});
        await FacultyModel.deleteMany({});
        await ClassroomModel.deleteMany({});
        await LabModel.deleteMany({});
        await TimetableSlotModel.deleteMany({});
        console.log('Old data cleared.');

        // Insert new data
        console.log('Seeding new data...');
        await SubjectModel.insertMany(subjects);
        await FacultyModel.insertMany(faculty);
        await ClassroomModel.insertMany(classrooms);
        await LabModel.insertMany(labs);
        console.log('Database seeded successfully!');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
};

seedDatabase();
