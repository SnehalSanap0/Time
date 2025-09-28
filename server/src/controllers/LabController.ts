import { Request, Response } from 'express';
import { LabModel } from '../models/TimetableModels';

export const getAllLabs = async (req: Request, res: Response) => {
  try {
    const labs = await LabModel.find().sort({ createdAt: -1 });
    res.json(labs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createLab = async (req: Request, res: Response) => {
  try {
    const lab = new LabModel(req.body);
    const savedLab = await lab.save();
    res.status(201).json(savedLab);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateLab = async (req: Request, res: Response) => {
  try {
    const lab = await LabModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lab) return res.status(404).json({ error: 'Lab not found' });
    res.json(lab);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteLab = async (req: Request, res: Response) => {
  try {
    const lab = await LabModel.findByIdAndDelete(req.params.id);
    if (!lab) return res.status(404).json({ error: 'Lab not found' });
    res.json({ message: 'Lab deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
