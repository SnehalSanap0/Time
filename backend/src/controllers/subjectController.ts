import { Request, Response } from "express";
import Subject from "../models/Subject";

export const getSubjects = async (_req: Request, res: Response) => {
  const data = await Subject.find().populate('faculty', 'name email department');
  res.json(data);
};

export const createSubject = async (req: Request, res: Response) => {
  const newSubject = new Subject(req.body);
  await newSubject.save();
  res.json(newSubject);
};

export const updateSubject = async (req: Request, res: Response) => {
  const updated = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
};

export const deleteSubject = async (req: Request, res: Response) => {
  await Subject.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};
