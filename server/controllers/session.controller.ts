import { type Response } from "express";
import { type RequestWithActiveConference } from "../middlewares/checkActiveConference";
import { sessionRepository } from "../repositories/sessionRepository";
import { registrationRepository } from "../repositories/registrationRepository";
import { insertSessionSchema } from "@shared/validation";

export const getSessionsByConferenceSlug = async (req: any, res: Response) => {
  try { res.json(await sessionRepository.getAll(req.params.conferenceSlug)); } catch (error) { res.status(500).json({ message: "Failed" }); }
};

export const getActiveConferenceSessions = async (req: RequestWithActiveConference, res: Response) => {
  try { if (!req.activeConference) return res.json([]); res.json(await sessionRepository.getAll(req.activeConference.slug)); } catch (error) { res.status(500).json({ message: "Failed" }); }
};

export const createSession = async (req: RequestWithActiveConference, res: Response) => {
  try { res.status(201).json(await sessionRepository.create(req.activeConference.slug, { ...insertSessionSchema.parse(req.body), conferenceId: req.activeConference.slug })); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const updateSession = async (req: RequestWithActiveConference, res: Response) => {
  try { res.json(await sessionRepository.update(req.activeConference.slug, req.params.id, req.body)); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const deleteSession = async (req: RequestWithActiveConference, res: Response) => {
  try { await sessionRepository.delete(req.activeConference.slug, req.params.id); res.json({ success: true }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const deleteAllSessions = async (req: RequestWithActiveConference, res: Response) => {
  try { await sessionRepository.deleteAll(req.activeConference.slug); res.json({ success: true }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const getSessionsCapacity = async (req: RequestWithActiveConference, res: Response) => {
    try { 
        if (!req.activeConference) {
            return res.json([]); 
        }
        
        const sessions = await sessionRepository.getAll(req.activeConference.slug);
        const status = await registrationRepository.getSessionCapacityStatus(sessions);
        
        res.json(status); 
    } catch (error: any) { 
        res.status(500).json({ message: "Failed" }); 
    }
};