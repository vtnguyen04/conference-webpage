import { type Response } from "express";
import { conferenceRepository } from "../repositories/conferenceRepository";
import { registrationRepository } from "../repositories/registrationRepository";
import { insertConferenceSchema } from "@shared/validation";
import { deleteFile } from "../utils";
export const getAllConferences = async (_req: any, res: Response) => {
  try { res.json(await conferenceRepository.getAll()); } catch (error) { res.status(500).json({ message: "Failed" }); }
};
export const getActiveConference = async (_req: any, res: Response) => {
  try { res.json(await conferenceRepository.getActive() || null); } catch (error) { res.status(500).json({ message: "Failed" }); }
};
export const getConferenceBySlug = async (req: any, res: Response) => {
  try {
    const conference = await conferenceRepository.getBySlug(req.params.slug);
    if (!conference) return res.status(404).json({ message: "Not found" });
    res.json(conference);
  } catch (error) { res.status(500).json({ message: "Failed" }); }
};
export const createConference = async (req: any, res: Response) => {
  try { res.status(201).json(await conferenceRepository.create(insertConferenceSchema.parse(req.body))); } catch (error: any) { res.status(400).json({ message: error.message }); }
};
export const updateConference = async (req: any, res: Response) => {
  try {
    const { filesToDelete, ...updates } = req.body;
    if (Array.isArray(filesToDelete)) for (const f of filesToDelete) await deleteFile(f);
    res.json(await conferenceRepository.update(req.params.conferenceSlug, updates));
  } catch (error: any) { res.status(400).json({ message: error.message }); }
};
export const cloneConference = async (req: any, res: Response) => {
  try {
    const { fromSlug } = req.params;
    const conference = await conferenceRepository.clone(fromSlug);
    res.status(201).json(conference);
  } catch (error: any) { res.status(400).json({ message: error.message }); }
};
export const activateConference = async (req: any, res: Response) => {
  try { await conferenceRepository.setActive(req.params.conferenceSlug); res.json({ success: true }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};
export const deleteConference = async (req: any, res: Response) => {
  try {
    await registrationRepository.deleteByConferenceSlug(req.params.conferenceSlug);
    await conferenceRepository.delete(req.params.conferenceSlug);
    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ message: error.message }); }
};