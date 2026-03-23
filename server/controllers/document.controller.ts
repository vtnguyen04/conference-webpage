import { type Response } from "express";
import { type RequestWithActiveConference } from "../middlewares/checkActiveConference";
import { documentService } from "../services/documentService";
import { insertDocumentSchema } from "@shared/validation";

export const getDocumentsByConferenceSlug = async (req: any, res: Response) => {
    try { res.json(await documentService.getAllByConference(req.params.conferenceSlug)); } catch (error) { res.status(500).json({ message: "Failed" }); }
};

export const getActiveConferenceDocuments = async (req: RequestWithActiveConference, res: Response) => {
    try { if (!req.activeConference) return res.json([]); res.json(await documentService.getAllByConference(req.activeConference.slug)); } catch (error) { res.status(500).json({ message: "Failed" }); }
};

export const getDocumentById = async (req: any, res: Response) => {
    try {
        const slug = req.params.conferenceSlug || (req as RequestWithActiveConference).activeConference?.slug;
        if (!slug) return res.status(404).json({ message: "No conference slug found" });
        const result = await documentService.getById(slug, req.params.id);
        if (!result) return res.status(404).json({ message: "Not found" });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Failed" });
    }
};

export const incrementDocumentViews = async (req: RequestWithActiveConference, res: Response) => {
    try {
        if (!req.activeConference) return res.status(404).json({ message: "No active conference" });
        const result = await documentService.incrementViews(req.activeConference.slug, req.params.id);
        if (!result) return res.status(404).json({ message: "Not found" });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Failed" });
    }
};

export const incrementDocumentViewsBySlug = async (req: any, res: Response) => {
    try {
        const result = await documentService.incrementViews(req.params.conferenceSlug, req.params.id);
        if (!result) return res.status(404).json({ message: "Not found" });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Failed" });
    }
};

export const createDocument = async (req: RequestWithActiveConference, res: Response) => {
    try { 
        const validatedData = insertDocumentSchema.parse(req.body);
        res.status(201).json(await documentService.createDocument(req.activeConference.slug, validatedData)); 
    } catch (error: any) { 
        res.status(400).json({ message: error.message }); 
    }
};

export const updateDocument = async (req: RequestWithActiveConference, res: Response) => {
    try { res.json(await documentService.updateDocument(req.activeConference.slug, req.params.id, req.body)); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const deleteDocument = async (req: RequestWithActiveConference, res: Response) => {
    try { await documentService.deleteDocument(req.activeConference.slug, req.params.id); res.json({ success: true }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const deleteAllDocuments = async (req: RequestWithActiveConference, res: Response) => {
    try { await documentService.deleteAllDocuments(req.activeConference.slug); res.json({ success: true }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};
