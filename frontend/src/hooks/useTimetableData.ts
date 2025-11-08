import { useState, useEffect, useCallback } from 'react';
import { Subject, Faculty, Classroom, Lab, TimetableSlot } from '../types/timetable';
import {
  subjectsService,
  facultyService,
  classroomsService,
  laboratoriesService,
  timetableSlotsService
} from '../services/api';

export const useTimetableData = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize data and set up real-time listeners
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Set up real-time listeners
        const unsubscribeSubjects = subjectsService.onSnapshot((data) => {
          setSubjects(data);
        });

        const unsubscribeFaculty = facultyService.onSnapshot((data) => {
          setFaculty(data);
        });

        const unsubscribeClassrooms = classroomsService.onSnapshot((data) => {
          setClassrooms(data);
        });

        const unsubscribeLabs = laboratoriesService.onSnapshot((data) => {
          setLabs(data);
        });

        const unsubscribeTimetableSlots = timetableSlotsService.onSnapshot((data) => {
          setTimetableSlots(data);
        });

        setLoading(false);

        // Return cleanup function
        return () => {
          unsubscribeSubjects();
          unsubscribeFaculty();
          unsubscribeClassrooms();
          unsubscribeLabs();
          unsubscribeTimetableSlots();
        };
      } catch (err) {
        console.error('Error initializing data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    const cleanup = initializeData();
    
    // Return cleanup function
    return () => {
      cleanup.then((cleanupFn) => {
        if (cleanupFn) {
          cleanupFn();
        }
      });
    };
  }, []);

  // Subject operations
  const addSubject = useCallback(async (subject: Omit<Subject, 'id'>) => {
    try {
      await subjectsService.add(subject);
    } catch (err) {
      console.error('Error adding subject:', err);
      setError(err instanceof Error ? err.message : 'Failed to add subject');
      throw err;
    }
  }, []);

  const updateSubject = useCallback(async (id: string, updatedSubject: Partial<Subject>) => {
    try {
      await subjectsService.update(id, updatedSubject);
    } catch (err) {
      console.error('Error updating subject:', err);
      setError(err instanceof Error ? err.message : 'Failed to update subject');
      throw err;
    }
  }, []);

  const deleteSubject = useCallback(async (id: string) => {
    try {
      await subjectsService.delete(id);
    } catch (err) {
      console.error('Error deleting subject:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete subject');
      throw err;
    }
  }, []);

  // Faculty operations
  const addFaculty = useCallback(async (facultyMember: Omit<Faculty, 'id'>) => {
    try {
      await facultyService.add(facultyMember);
    } catch (err) {
      console.error('Error adding faculty:', err);
      setError(err instanceof Error ? err.message : 'Failed to add faculty');
      throw err;
    }
  }, []);

  const updateFaculty = useCallback(async (id: string, updatedFaculty: Partial<Faculty>) => {
    try {
      await facultyService.update(id, updatedFaculty);
    } catch (err) {
      console.error('Error updating faculty:', err);
      setError(err instanceof Error ? err.message : 'Failed to update faculty');
      throw err;
    }
  }, []);

  const deleteFaculty = useCallback(async (id: string) => {
    try {
      await facultyService.delete(id);
    } catch (err) {
      console.error('Error deleting faculty:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete faculty');
      throw err;
    }
  }, []);

  // Classroom operations
  const addClassroom = useCallback(async (classroom: Omit<Classroom, 'id'>) => {
    try {
      await classroomsService.add(classroom);
    } catch (err) {
      console.error('Error adding classroom:', err);
      setError(err instanceof Error ? err.message : 'Failed to add classroom');
      throw err;
    }
  }, []);

  const updateClassroom = useCallback(async (id: string, updatedClassroom: Partial<Classroom>) => {
    try {
      await classroomsService.update(id, updatedClassroom);
    } catch (err) {
      console.error('Error updating classroom:', err);
      setError(err instanceof Error ? err.message : 'Failed to update classroom');
      throw err;
    }
  }, []);

  const deleteClassroom = useCallback(async (id: string) => {
    try {
      await classroomsService.delete(id);
    } catch (err) {
      console.error('Error deleting classroom:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete classroom');
      throw err;
    }
  }, []);

  // Lab operations
  const addLab = useCallback(async (lab: Omit<Lab, 'id'>) => {
    try {
      await laboratoriesService.add(lab);
    } catch (err) {
      console.error('Error adding lab:', err);
      setError(err instanceof Error ? err.message : 'Failed to add lab');
      throw err;
    }
  }, []);

  const updateLab = useCallback(async (id: string, updatedLab: Partial<Lab>) => {
    try {
      await laboratoriesService.update(id, updatedLab);
    } catch (err) {
      console.error('Error updating lab:', err);
      setError(err instanceof Error ? err.message : 'Failed to update lab');
      throw err;
    }
  }, []);

  const deleteLab = useCallback(async (id: string) => {
    try {
      await laboratoriesService.delete(id);
    } catch (err) {
      console.error('Error deleting lab:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete lab');
      throw err;
    }
  }, []);

  // Timetable operations
  const addTimetableSlot = useCallback(async (slot: Omit<TimetableSlot, 'id'>) => {
    try {
      await timetableSlotsService.add(slot);
    } catch (err) {
      console.error('Error adding timetable slot:', err);
      setError(err instanceof Error ? err.message : 'Failed to add timetable slot');
      throw err;
    }
  }, []);

  const updateTimetableSlot = useCallback(async (id: string, updatedSlot: Partial<TimetableSlot>) => {
    try {
      await timetableSlotsService.update(id, updatedSlot);
    } catch (err) {
      console.error('Error updating timetable slot:', err);
      setError(err instanceof Error ? err.message : 'Failed to update timetable slot');
      throw err;
    }
  }, []);

  const deleteTimetableSlot = useCallback(async (id: string) => {
    try {
      await timetableSlotsService.delete(id);
    } catch (err) {
      console.error('Error deleting timetable slot:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete timetable slot');
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Data
    subjects,
    faculty,
    classrooms,
    labs,
    timetableSlots,
    loading,
    error,
    
    // Subject operations
    addSubject,
    updateSubject,
    deleteSubject,
    
    // Faculty operations
    addFaculty,
    updateFaculty,
    deleteFaculty,
    
    // Classroom operations
    addClassroom,
    updateClassroom,
    deleteClassroom,
    
    // Lab operations
    addLab,
    updateLab,
    deleteLab,
    
    // Timetable operations
    addTimetableSlot,
    updateTimetableSlot,
    deleteTimetableSlot,
    setTimetableSlots,
    
    // Error handling
    clearError,
  };
};