
import { type Response } from "express";
import { type RequestWithActiveConference } from "../middlewares/checkActiveConference";
import { announcementRepository } from "../repositories/announcementRepository";
import { conferenceRepository } from "../repositories/conferenceRepository";
import { insertAnnouncementSchema } from "@shared/validation";
import { deleteFile } from "../utils";

export const getAnnouncementsByConferenceSlug = async (req: any, res: Response) => {
    try { res.json(await announcementRepository.getAll(req.params.conferenceSlug)); } catch (error) { res.status(500).json({ message: "Failed" }); }
};

export const getActiveConferenceAnnouncements = async (req: RequestWithActiveConference, res: Response) => {
    try { if (!req.activeConference) return res.json([]); res.json(await announcementRepository.getAll(req.activeConference.slug)); } catch (error) { res.status(500).json({ message: "Failed" }); }
};

export const getAnnouncementById = async (req: any, res: Response) => {
    try {
        let { conferenceSlug, id } = req.params;
        if (conferenceSlug === 'active') {
            const active = await conferenceRepository.getActive();
            if (!active) return res.status(404).json({ message: "No active conference found." });
            conferenceSlug = active.slug;
        }
        
        // Trả về dữ liệu thuần túy, không tăng view ở đây
        const announcement = await announcementRepository.getById(conferenceSlug, id);
        
        if (!announcement) return res.status(404).json({ message: "Not found" });
        res.json(announcement);
    } catch (error: any) { res.status(500).json({ message: "Failed" }); }
};

export const createAnnouncement = async (req: RequestWithActiveConference, res: Response) => {
    try { 
        const data = insertAnnouncementSchema.parse(req.body);
        const announcement = await announcementRepository.create(req.activeConference.slug, {
            ...data,
            publishedAt: data.publishedAt || new Date().toISOString(),
            conferenceId: req.activeConference.slug,
            views: 0
        });
        res.status(201).json(announcement); 
    } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const updateAnnouncement = async (req: RequestWithActiveConference, res: Response) => {
    try {
        const { id } = req.params; const slug = req.activeConference.slug;
        const existing = await announcementRepository.getById(slug, id);
        if (!existing) return res.status(404).json({ message: "Not found" });
        if (req.body.featuredImageUrl && existing.featuredImageUrl && req.body.featuredImageUrl !== existing.featuredImageUrl) await deleteFile(existing.featuredImageUrl);
        res.json(await announcementRepository.update(slug, id, req.body));
    } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const incrementAnnouncementViews = async (req: RequestWithActiveConference, res: Response) => {
    try { res.json(await announcementRepository.incrementViews(req.activeConference.slug, req.params.id)); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const incrementAnnouncementViewsBySlug = async (req: any, res: Response) => {
    try { res.json(await announcementRepository.incrementViews(req.params.conferenceSlug, req.params.id)); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const deleteAnnouncement = async (req: RequestWithActiveConference, res: Response) => {
    try { await announcementRepository.delete(req.activeConference.slug, req.params.id); res.json({ success: true }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const deleteAllAnnouncements = async (req: RequestWithActiveConference, res: Response) => {
    try { await announcementRepository.deleteAll(req.activeConference.slug); res.json({ success: true }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};
