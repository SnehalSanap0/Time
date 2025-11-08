import { Request, Response } from "express";
import Classroom from "../models/Classroom";

export const getClassrooms = async (_req: Request, res: Response) => {
  const data = await Classroom.find();
  res.json(data);
};

export const createClassroom = async (req: Request, res: Response) => {
  const newClassroom = new Classroom(req.body);
  await newClassroom.save();
  res.json(newClassroom);
};

export const updateClassroom = async (req: Request, res: Response) => {
  const updated = await Classroom.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
};

export const deleteClassroom = async (req: Request, res: Response) => {
  await Classroom.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};
