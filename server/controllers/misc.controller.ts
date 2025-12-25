import { contactFormSchema, insertSightseeingSchema } from "@shared/validation";
import { type Response } from "express";
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { type RequestWithActiveConference } from "../middlewares/checkActiveConference";
import { contactRepository } from "../repositories/contactRepository";
import { registrationRepository } from "../repositories/registrationRepository";
import { sessionRepository } from "../repositories/sessionRepository";
import { sightseeingRepository } from "../repositories/sightseeingRepository";
import { sponsorRepository } from "../repositories/sponsorRepository";
import { deleteFile } from "../utils";

async function processAndSaveImage(buffer: Buffer, _originalName: string, type: 'banner' | 'avatar' | 'general' = 'general'): Promise<string> {
    const filename = `img-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    const absolutePath = path.join(process.cwd(), "public", "uploads", filename);
    let pipeline = sharp(buffer).rotate();
    if (type === 'banner') pipeline = pipeline.resize(1920, 1080, { fit: 'inside', withoutEnlargement: true });
    else if (type === 'avatar') pipeline = pipeline.resize(400, 400, { fit: 'cover' });
    else pipeline = pipeline.resize(1200, null, { withoutEnlargement: true });
    await pipeline.webp({ quality: 80, effort: 6 }).toFile(absolutePath);
    return `/uploads/${filename}`;
}

export const uploadImage = async (req: any, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file" });
        const imagePath = await processAndSaveImage(req.file.buffer, req.file.originalname, req.body.type || 'general');
        if (req.body.oldImagePath) await deleteFile(req.body.oldImagePath);
        res.json({ imagePath });
    } catch (error: any) { res.status(500).json({ message: "Failed" }); }
};

export const uploadPdf = async (req: any, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file" });
        const filename = `document-${Date.now()}.pdf`;
        const absolutePath = path.join(process.cwd(), "public", "uploads", filename);
        await fs.writeFile(absolutePath, req.file.buffer);
        if (req.body.oldPdfPath) await deleteFile(req.body.oldPdfPath);
        res.json({ pdfPath: `/uploads/${filename}` });
    } catch (error: any) { res.status(500).json({ message: "Failed" }); }
};

export const uploadBanners = async (req: any, res: Response) => {
    try {
        const files = req.files as any[];
        const imagePaths = await Promise.all(files.map(file => processAndSaveImage(file.buffer, file.originalname, 'banner')));
        res.json({ imagePaths });
    } catch (error: any) { res.status(500).json({ message: "Failed" }); }
};

export const deleteUpload = async (req: any, res: Response) => {
    try { if (req.query.filePath) { await deleteFile(req.query.filePath as string); res.json({ success: true }); } else res.status(400).json({ message: "Missing path" }); } catch (error: any) { res.status(500).json({ message: "Failed" }); }
};

export const getActiveConferenceSightseeing = async (req: RequestWithActiveConference, res: Response) => {
    try { res.json(await sightseeingRepository.getAll(req.activeConference.slug)); } catch (error) { res.status(500).json({ message: "Failed" }); }
};

export const getSightseeingBySlug = async (req: any, res: Response) => {
    try { res.json(await sightseeingRepository.getAll(req.params.conferenceSlug)); } catch (error) { res.status(500).json({ message: "Failed" }); }
};

export const getSightseeingItemById = async (req: RequestWithActiveConference, res: Response) => {
    try { res.json(await sightseeingRepository.getById(req.activeConference.slug, req.params.id)); } catch (error: any) { res.status(500).json({ message: "Failed" }); }
};

export const getSightseeingItemBySlugAndId = async (req: any, res: Response) => {
    try { res.json(await sightseeingRepository.getById(req.params.conferenceSlug, req.params.id)); } catch (error: any) { res.status(500).json({ message: "Failed" }); }
};

export const createSightseeingItem = async (req: RequestWithActiveConference, res: Response) => {
    try { res.status(201).json(await sightseeingRepository.create(req.activeConference.slug, { ...insertSightseeingSchema.parse(req.body), conferenceId: req.activeConference.slug })); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const updateSightseeingItem = async (req: RequestWithActiveConference, res: Response) => {
    try { res.json(await sightseeingRepository.update(req.activeConference.slug, req.params.id, req.body)); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const deleteSightseeingItem = async (req: RequestWithActiveConference, res: Response) => {
    try { await sightseeingRepository.delete(req.activeConference.slug, req.params.id); res.json({ success: true }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const getAdminStats = async (req: RequestWithActiveConference, res: Response) => {
    try {
        const slug = req.activeConference.slug;
        const sessions = await sessionRepository.getAll(slug);
        const sponsors = await sponsorRepository.getAll(slug);
        const regStats = await registrationRepository.getStats(slug);
        res.json({ totalSessions: sessions.length, totalSponsors: sponsors.length, ...regStats });
    } catch (error) { res.status(500).json({ message: "Failed" }); }
};

export const createNewContactMessage = async (req: any, res: Response) => {
    try { res.status(201).json(await contactRepository.create(contactFormSchema.parse(req.body))); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const getContactMessagesPaginated = async (req: any, res: Response) => {
    try { res.json(await contactRepository.getAllPaginated(parseInt(req.query.page as string) || 1, parseInt(req.query.limit as string) || 10)); } catch (error) { res.status(500).json({ message: "Failed" }); }
};

export const searchAdminContactMessages = async (req: any, res: Response) => {
    try { res.json(await contactRepository.search(req.query.query as string, parseInt(req.query.page as string) || 1, parseInt(req.query.limit as string) || 10)); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const deleteAdminContactMessage = async (req: RequestWithActiveConference, res: Response) => {
    try { if (await contactRepository.delete(req.params.id)) res.json({ success: true }); else res.status(404).json({ message: "Not found" }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const deleteAllAdminContactMessages = async (_req: any, res: Response) => {
    try { await contactRepository.deleteAll(); res.json({ success: true }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};
