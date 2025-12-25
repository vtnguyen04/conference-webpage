import { type Response } from "express";
import { type RequestWithActiveConference } from "../middlewares/checkActiveConference";
import { speakerRepository } from "../repositories/speakerRepository";
import { speakerService } from "../services/speakerService";
import { insertSpeakerSchema } from "@shared/validation";
export const getSpeakersByConferenceSlug = async (req: any, res: Response) => {
  try { res.json(await speakerRepository.getAll(req.params.conferenceSlug)); } catch (error) { res.status(500).json({ message: "Failed" }); }
};
export const getActiveConferenceSpeakers = async (req: RequestWithActiveConference, res: Response) => {
  try { if (!req.activeConference) return res.json([]); res.json(await speakerRepository.getAll(req.activeConference.slug)); } catch (error) { res.status(500).json({ message: "Failed" }); }
};
export const createSpeaker = async (req: RequestWithActiveConference, res: Response) => {
  try { res.status(201).json(await speakerService.createSpeaker(req.activeConference.slug, insertSpeakerSchema.parse(req.body), req.activeConference)); } catch (error: any) { res.status(400).json({ message: error.message }); }
};
export const updateSpeaker = async (req: RequestWithActiveConference, res: Response) => {
  try { res.json(await speakerService.updateSpeaker(req.activeConference.slug, req.params.id, req.body, req.activeConference)); } catch (error: any) { res.status(400).json({ message: error.message }); }
};
export const deleteSpeaker = async (req: RequestWithActiveConference, res: Response) => {
  try { await speakerRepository.delete(req.activeConference.slug, req.params.id); res.json({ success: true }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};
export const deleteAllSpeakers = async (req: RequestWithActiveConference, res: Response) => {
    try { await speakerRepository.deleteAll(req.activeConference.slug); res.json({ success: true }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};
