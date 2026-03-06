import { insertDocumentSchema } from "@shared/validation";
import { type Response } from "express";
import { type RequestWithActiveConference } from "../middlewares/checkActiveConference";
import { conferenceRepository } from "../repositories/conferenceRepository";
import { documentRepository } from "../repositories/documentRepository";
import { deleteFile } from "../utils";

export const getDocumentsByConferenceSlug = async (req: any, res: Response) => {
    try { res.json(await documentRepository.getAll(req.params.conferenceSlug)); } catch (error) { res.status(500).json({ message: "Failed" }); }
};

export const getActiveConferenceDocuments = async (req: RequestWithActiveConference, res: Response) => {
    try { if (!req.activeConference) return res.json([]); res.json(await documentRepository.getAll(req.activeConference.slug)); } catch (error) { res.status(500).json({ message: "Failed" }); }
};

export const getDocumentById = async (req: any, res: Response) => {
    try {
        let { conferenceSlug, id } = req.params;
        if (conferenceSlug === 'active') {
            const active = await conferenceRepository.getActive();
            if (!active) return res.status(404).json({ message: "No active conference found." });
            conferenceSlug = active.slug;
        }
        const document = await documentRepository.getById(conferenceSlug, id);
        if (!document) return res.status(404).json({ message: "Not found" });
        res.json(document);
    } catch (error: any) { res.status(500).json({ message: "Failed" }); }
};

export const createDocument = async (req: RequestWithActiveConference, res: Response) => {
    try {
        const data = insertDocumentSchema.parse(req.body);
        const document = await documentRepository.create(req.activeConference.slug, {
            ...data,
            publishedAt: data.publishedAt || new Date().toISOString(),
            conferenceId: req.activeConference.slug,
            views: 0
        });
        res.status(201).json(document);
    } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const updateDocument = async (req: RequestWithActiveConference, res: Response) => {
    try {
        const { id } = req.params; const slug = req.activeConference.slug;
        const existing = await documentRepository.getById(slug, id);
        if (!existing) return res.status(404).json({ message: "Not found" });
        if (req.body.featuredImageUrl && existing.featuredImageUrl && req.body.featuredImageUrl !== existing.featuredImageUrl) await deleteFile(existing.featuredImageUrl);
        res.json(await documentRepository.update(slug, id, req.body));
    } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const incrementDocumentViews = async (req: RequestWithActiveConference, res: Response) => {
    try { res.json(await documentRepository.incrementViews(req.activeConference.slug, req.params.id)); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const incrementDocumentViewsBySlug = async (req: any, res: Response) => {
    try { res.json(await documentRepository.incrementViews(req.params.conferenceSlug, req.params.id)); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const deleteDocument = async (req: RequestWithActiveConference, res: Response) => {
    try { await documentRepository.delete(req.activeConference.slug, req.params.id); res.json({ success: true }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const deleteAllDocuments = async (req: RequestWithActiveConference, res: Response) => {
    try { await documentRepository.deleteAll(req.activeConference.slug); res.json({ success: true }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};
