import { Request, Response } from "express";
import Timetable from "../models/Timetable";

export const getTimetables = async (_req: Request, res: Response) => {
  const data = await Timetable.find();
  res.json(data);
};

export const createTimetable = async (req: Request, res: Response) => {
  const newTimetable = new Timetable(req.body);
  await newTimetable.save();
  res.json(newTimetable);
};

export const updateTimetable = async (req: Request, res: Response) => {
  const updated = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
};

export const deleteTimetable = async (req: Request, res: Response) => {
  await Timetable.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};
