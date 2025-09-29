import { Request, Response } from "express";
import Lab from "../models/Lab";

export const getLabs = async (_req: Request, res: Response) => {
  const data = await Lab.find();
  res.json(data);
};

export const createLab = async (req: Request, res: Response) => {
  const newLab = new Lab(req.body);
  await newLab.save();
  res.json(newLab);
};

export const updateLab = async (req: Request, res: Response) => {
  const updated = await Lab.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
};

export const deleteLab = async (req: Request, res: Response) => {
  await Lab.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};
