import { type Response } from "express";
import { type RequestWithActiveConference } from "../middlewares/checkActiveConference";
import { organizerRepository } from "../repositories/organizerRepository";
import { insertOrganizerSchema } from "@shared/validation";

export const getOrganizersByConferenceSlug = async (req: any, res: Response) => {
    try { res.json(await organizerRepository.getAll(req.params.conferenceSlug)); } catch (error) { res.status(500).json({ message: "Failed" }); }
};

export const getActiveConferenceOrganizers = async (req: RequestWithActiveConference, res: Response) => {
    try { if (!req.activeConference) return res.json([]); res.json(await organizerRepository.getAll(req.activeConference.slug)); } catch (error) { res.status(500).json({ message: "Failed" }); }
};

export const createOrganizer = async (req: RequestWithActiveConference, res: Response) => {
    try { res.status(201).json(await organizerRepository.create(req.activeConference.slug, { ...insertOrganizerSchema.parse(req.body), conferenceId: req.activeConference.slug })); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const updateOrganizer = async (req: RequestWithActiveConference, res: Response) => {
    try { res.json(await organizerRepository.update(req.activeConference.slug, req.params.id, req.body)); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const deleteOrganizer = async (req: RequestWithActiveConference, res: Response) => {
    try { await organizerRepository.delete(req.activeConference.slug, req.params.id); res.json({ success: true }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const deleteAllOrganizers = async (req: RequestWithActiveConference, res: Response) => {
    try { await organizerRepository.deleteAll(req.activeConference.slug); res.json({ success: true }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};