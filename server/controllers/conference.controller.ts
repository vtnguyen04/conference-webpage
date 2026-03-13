import { type Response } from "express";
import { conferenceService } from "../services/conferenceService";
import { insertConferenceSchema } from "@shared/validation";

export const getAllConferences = async (_req: any, res: Response) => {
    try { 
        res.json(await conferenceService.getAllConferences()); 
    } catch (error) { 
        res.status(500).json({ message: "Failed" }); 
    }
};

export const getActiveConference = async (_req: any, res: Response) => {
    try { 
        res.json(await conferenceService.getActiveConference() || null); 
    } catch (error) { 
        res.status(500).json({ message: "Failed" }); 
    }
};

export const getConferenceBySlug = async (req: any, res: Response) => {
    try {
        const conference = await conferenceService.getBySlug(req.params.slug);
        if (!conference) return res.status(404).json({ message: "Not found" });
        res.json(conference);
    } catch (error) { 
        res.status(500).json({ message: "Failed" }); 
    }
};

export const createConference = async (req: any, res: Response) => {
    try { 
        const validatedData = insertConferenceSchema.parse(req.body);
        res.status(201).json(await conferenceService.createConference(validatedData)); 
    } catch (error: any) { 
        res.status(400).json({ message: error.message }); 
    }
};

export const updateConference = async (req: any, res: Response) => {
    try {
        const result = await conferenceService.updateConference(req.params.conferenceSlug, req.body);
        res.json(result);
    } catch (error: any) { 
        res.status(400).json({ message: error.message }); 
    }
};

export const cloneConference = async (req: any, res: Response) => {
    try {
        const { fromSlug } = req.params;
        const conference = await conferenceService.cloneConference(fromSlug);
        res.status(201).json(conference);
    } catch (error: any) { 
        res.status(400).json({ message: error.message }); 
    }
};

export const activateConference = async (req: any, res: Response) => {
    try { 
        await conferenceService.setActiveConference(req.params.conferenceSlug); 
        res.json({ success: true }); 
    } catch (error: any) { 
        res.status(400).json({ message: error.message }); 
    }
};

export const deleteConference = async (req: any, res: Response) => {
    try {
        await conferenceService.deleteConference(req.params.conferenceSlug);
        res.json({ success: true });
    } catch (error: any) { 
        res.status(500).json({ message: error.message }); 
    }
};
