import { type Response } from "express";
import { type RequestWithActiveConference } from "../middlewares/checkActiveConference";
import { organizerService } from "../services/organizerService";
import { insertOrganizerSchema } from "@shared/validation";

export const getOrganizersByConferenceSlug = async (req: any, res: Response) => {
    try { res.json(await organizerService.getAllByConference(req.params.conferenceSlug)); } catch (_) { res.status(500).json({ message: "Failed" }); }
};

export const getActiveConferenceOrganizers = async (req: RequestWithActiveConference, res: Response) => {
    try { if (!req.activeConference) return res.json([]); res.json(await organizerService.getAllByConference(req.activeConference.slug)); } catch (_) { res.status(500).json({ message: "Failed" }); }
};

export const createOrganizer = async (req: RequestWithActiveConference, res: Response) => {
    try { 
        const validatedData = insertOrganizerSchema.parse(req.body);
        res.status(201).json(await organizerService.createOrganizer(req.activeConference.slug, validatedData)); 
    } catch (error: any) { 
        res.status(400).json({ message: error.message }); 
    }
};

export const updateOrganizer = async (req: RequestWithActiveConference, res: Response) => {
    try { res.json(await organizerService.updateOrganizer(req.activeConference.slug, req.params.id, req.body)); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const deleteOrganizer = async (req: RequestWithActiveConference, res: Response) => {
    try { await organizerService.deleteOrganizer(req.activeConference.slug, req.params.id); res.json({ success: true }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const deleteAllOrganizers = async (req: RequestWithActiveConference, res: Response) => {
    try { await organizerService.deleteAllOrganizers(req.activeConference.slug); res.json({ success: true }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};
