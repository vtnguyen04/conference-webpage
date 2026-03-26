import { type Response } from "express";
import { type RequestWithActiveConference } from "../middlewares/checkActiveConference";
import { sponsorService } from "../services/sponsorService";
import { insertSponsorSchema } from "@shared/validation";

export const getSponsorsByConferenceSlug = async (req: any, res: Response) => {
    try { 
        res.json(await sponsorService.getAllSponsors(req.params.conferenceSlug)); 
    } catch (_error) { 
        res.status(500).json({ message: "Failed" }); 
    }
};

export const getActiveConferenceSponsors = async (req: RequestWithActiveConference, res: Response) => {
    try { 
        if (!req.activeConference) return res.json([]); 
        res.json(await sponsorService.getAllSponsors(req.activeConference.slug)); 
    } catch (_error) { 
        res.status(500).json({ message: "Failed" }); 
    }
};

export const createSponsor = async (req: RequestWithActiveConference, res: Response) => {
    try { 
        const validatedData = insertSponsorSchema.parse(req.body);
        res.status(201).json(await sponsorService.createSponsor(req.activeConference.slug, validatedData)); 
    } catch (error: any) { 
        res.status(400).json({ message: error.message }); 
    }
};

export const updateSponsor = async (req: RequestWithActiveConference, res: Response) => {
    try { 
        res.json(await sponsorService.updateSponsor(req.activeConference.slug, req.params.id, req.body)); 
    } catch (error: any) { 
        res.status(400).json({ message: error.message }); 
    }
};

export const deleteSponsor = async (req: RequestWithActiveConference, res: Response) => {
    try { 
        await sponsorService.deleteSponsor(req.activeConference.slug, req.params.id); 
        res.json({ success: true }); 
    } catch (error: any) { 
        res.status(400).json({ message: error.message }); 
    }
};

export const deleteAllSponsors = async (req: RequestWithActiveConference, res: Response) => {
    try { 
        await sponsorService.deleteAllSponsors(req.activeConference.slug); 
        res.json({ success: true }); 
    } catch (error: any) { 
        res.status(400).json({ message: error.message }); 
    }
};
