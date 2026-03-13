import { type Response } from "express";
import { type RequestWithActiveConference } from "../middlewares/checkActiveConference";
import { sessionService } from "../services/sessionService";
import { insertSessionSchema } from "@shared/validation";

export const getSessionsByConferenceSlug = async (req: any, res: Response) => {
    try { 
        res.json(await sessionService.getAllSessions(req.params.conferenceSlug)); 
    } catch (error) { 
        res.status(500).json({ message: "Failed" }); 
    }
};

export const getActiveConferenceSessions = async (req: RequestWithActiveConference, res: Response) => {
    try { 
        if (!req.activeConference) return res.json([]); 
        res.json(await sessionService.getAllSessions(req.activeConference.slug)); 
    } catch (error) { 
        res.status(500).json({ message: "Failed" }); 
    }
};

export const createSession = async (req: RequestWithActiveConference, res: Response) => {
    try { 
        const validatedData = insertSessionSchema.parse(req.body);
        res.status(201).json(await sessionService.createSession(req.activeConference.slug, validatedData)); 
    } catch (error: any) { 
        res.status(400).json({ message: error.message }); 
    }
};

export const updateSession = async (req: RequestWithActiveConference, res: Response) => {
    try { 
        res.json(await sessionService.updateSession(req.activeConference.slug, req.params.id, req.body)); 
    } catch (error: any) { 
        res.status(400).json({ message: error.message }); 
    }
};

export const deleteSession = async (req: RequestWithActiveConference, res: Response) => {
    try { 
        await sessionService.deleteSession(req.activeConference.slug, req.params.id); 
        res.json({ success: true }); 
    } catch (error: any) { 
        res.status(400).json({ message: error.message }); 
    }
};

export const deleteAllSessions = async (req: RequestWithActiveConference, res: Response) => {
    try { 
        await sessionService.deleteAllSessions(req.activeConference.slug); 
        res.json({ success: true }); 
    } catch (error: any) { 
        res.status(400).json({ message: error.message }); 
    }
};

export const getSessionsCapacity = async (req: RequestWithActiveConference, res: Response) => {
    try { 
        if (!req.activeConference) return res.json([]); 
        res.json(await sessionService.getSessionsCapacityStatus(req.activeConference.slug)); 
    } catch (error: any) { 
        res.status(500).json({ message: "Failed" }); 
    }
};
