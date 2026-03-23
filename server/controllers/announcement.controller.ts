import { type Response } from "express";
import { type RequestWithActiveConference } from "../middlewares/checkActiveConference";
import { announcementService } from "../services/announcementService";
import { insertAnnouncementSchema } from "@shared/validation";

export const getAnnouncementsByConferenceSlug = async (req: any, res: Response) => {
    try { 
        res.json(await announcementService.getAllByConference(req.params.conferenceSlug)); 
    } catch (error) { 
        res.status(500).json({ message: "Failed" }); 
    }
};

export const getActiveConferenceAnnouncements = async (req: RequestWithActiveConference, res: Response) => {
    try { 
        if (!req.activeConference) return res.json([]); 
        res.json(await announcementService.getAllByConference(req.activeConference.slug)); 
    } catch (error) { 
        res.status(500).json({ message: "Failed" }); 
    }
};

export const getAnnouncementById = async (req: any, res: Response) => {
    try {
        const slug = req.params.conferenceSlug || (req as RequestWithActiveConference).activeConference?.slug;
        if (!slug) return res.status(404).json({ message: "No conference slug found" });
        const result = await announcementService.getById(slug, req.params.id);
        if (!result) return res.status(404).json({ message: "Not found" });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Failed" });
    }
};

export const incrementAnnouncementViews = async (req: RequestWithActiveConference, res: Response) => {
    try {
        if (!req.activeConference) return res.status(404).json({ message: "No active conference" });
        const result = await announcementService.incrementViews(req.activeConference.slug, req.params.id);
        if (!result) return res.status(404).json({ message: "Not found" });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Failed" });
    }
};

export const incrementAnnouncementViewsBySlug = async (req: any, res: Response) => {
    try {
        const result = await announcementService.incrementViews(req.params.conferenceSlug, req.params.id);
        if (!result) return res.status(404).json({ message: "Not found" });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Failed" });
    }
};

export const createAnnouncement = async (req: RequestWithActiveConference, res: Response) => {
    try { 
        const validatedData = insertAnnouncementSchema.parse(req.body);
        res.status(201).json(await announcementService.createAnnouncement(req.activeConference.slug, validatedData)); 
    } catch (error: any) { 
        res.status(400).json({ message: error.message }); 
    }
};

export const updateAnnouncement = async (req: RequestWithActiveConference, res: Response) => {
    try { 
        res.json(await announcementService.updateAnnouncement(req.activeConference.slug, req.params.id, req.body)); 
    } catch (error: any) { 
        res.status(400).json({ message: error.message }); 
    }
};

export const deleteAnnouncement = async (req: RequestWithActiveConference, res: Response) => {
    try { 
        await announcementService.deleteAnnouncement(req.activeConference.slug, req.params.id); 
        res.json({ success: true }); 
    } catch (error: any) { 
        res.status(400).json({ message: error.message }); 
    }
};

export const deleteAllAnnouncements = async (req: RequestWithActiveConference, res: Response) => {
    try { 
        await announcementService.deleteAllAnnouncements(req.activeConference.slug); 
        res.json({ success: true }); 
    } catch (error: any) { 
        res.status(400).json({ message: error.message }); 
    }
};
