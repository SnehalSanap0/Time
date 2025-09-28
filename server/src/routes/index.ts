import { Router } from 'express';

// Import all controller functions
import { getAllSubjects, createSubject, updateSubject, deleteSubject } from '../controllers/SubjectController';
import { getAllFaculty, createFaculty, updateFaculty, deleteFaculty } from '../controllers/FacultyController';
import { getAllClassrooms, createClassroom, updateClassroom, deleteClassroom } from '../controllers/ClassroomController';
import { getAllLabs, createLab, updateLab, deleteLab } from '../controllers/LabController';
import { 
    getAllTimetableSlots, 
    createTimetableSlot, 
    createBatchTimetableSlots, 
    deleteAllTimetableSlots, 
    deleteTimetableSlot 
} from '../controllers/TimetableController';

const router = Router();

// --- Health Check ---
// Note: The health check is in server.ts, but you could move it here if you prefer.
// router.get('/health', (req, res) => res.json({ status: 'OK' }));

// --- Subjects Routes ---
router.get('/subjects', getAllSubjects);
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

// --- Faculty Routes ---
router.get('/faculty', getAllFaculty);
router.post('/faculty', createFaculty);
router.put('/faculty/:id', updateFaculty);
router.delete('/faculty/:id', deleteFaculty);

// --- Classrooms Routes ---
router.get('/classrooms', getAllClassrooms);
router.post('/classrooms', createClassroom);
router.put('/classrooms/:id', updateClassroom);
router.delete('/classrooms/:id', deleteClassroom);

// --- Labs Routes ---
router.get('/labs', getAllLabs);
router.post('/labs', createLab);
router.put('/labs/:id', updateLab);
router.delete('/labs/:id', deleteLab);

// --- Timetable Slots Routes ---
router.get('/timetable-slots', getAllTimetableSlots);
router.post('/timetable-slots', createTimetableSlot);
router.post('/timetable-slots/batch', createBatchTimetableSlots); // For inserting multiple slots
router.delete('/timetable-slots', deleteAllTimetableSlots); // For clearing all slots
router.delete('/timetable-slots/:id', deleteTimetableSlot);


// NOTE: The '/api/initialize-data' route was removed as it's better handled
// by the dedicated `seed.ts` script (`npm run db:seed`).
// Keeping seeding logic out of the main API is a security best practice.

export default router;

