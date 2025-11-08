import { Request, Response } from "express";
import Faculty from "../models/Faculty";

export const getFaculty = async (_req: Request, res: Response) => {
  const data = await Faculty.find();
  res.json(data);
};

export const createFaculty = async (req: Request, res: Response) => {
  const newFaculty = new Faculty(req.body);
  await newFaculty.save();
  res.json(newFaculty);
};

export const updateFaculty = async (req: Request, res: Response) => {
  const updated = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
};

export const deleteFaculty = async (req: Request, res: Response) => {
  await Faculty.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};
