import { Request, Response } from 'express';
import { ClassroomModel } from '../models/TimetableModels';

export const getAllClassrooms = async (req: Request, res: Response) => {
  try {
    const classrooms = await ClassroomModel.find().sort({ createdAt: -1 });
    res.json(classrooms);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createClassroom = async (req: Request, res: Response) => {
  try {
    const classroom = new ClassroomModel(req.body);
    const savedClassroom = await classroom.save();
    res.status(201).json(savedClassroom);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateClassroom = async (req: Request, res: Response) => {
  try {
    const classroom = await ClassroomModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!classroom) return res.status(404).json({ error: 'Classroom not found' });
    res.json(classroom);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteClassroom = async (req: Request, res: Response) => {
  try {
    const classroom = await ClassroomModel.findByIdAndDelete(req.params.id);
    if (!classroom) return res.status(404).json({ error: 'Classroom not found' });
    res.json({ message: 'Classroom deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
