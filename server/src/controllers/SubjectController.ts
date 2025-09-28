import { Request, Response } from 'express';
import { SubjectModel } from '../models/TimetableModels';

export const getAllSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await SubjectModel.find().sort({ createdAt: -1 });
    res.json(subjects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createSubject = async (req: Request, res: Response) => {
  try {
    const subject = new SubjectModel(req.body);
    const savedSubject = await subject.save();
    res.status(201).json(savedSubject);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateSubject = async (req: Request, res: Response) => {
  try {
    const subject = await SubjectModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json(subject);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const subject = await SubjectModel.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json({ message: 'Subject deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
