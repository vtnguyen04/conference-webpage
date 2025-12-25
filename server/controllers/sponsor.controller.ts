import { type Response } from "express";
import { type RequestWithActiveConference } from "../middlewares/checkActiveConference";
import { sponsorRepository } from "../repositories/sponsorRepository";
import { insertSponsorSchema } from "@shared/validation";
export const getSponsorsByConferenceSlug = async (req: any, res: Response) => {
    try { res.json(await sponsorRepository.getAll(req.params.conferenceSlug)); } catch (error) { res.status(500).json({ message: "Failed" }); }
};
export const getActiveConferenceSponsors = async (req: RequestWithActiveConference, res: Response) => {
    try { if (!req.activeConference) return res.json([]); res.json(await sponsorRepository.getAll(req.activeConference.slug)); } catch (error) { res.status(500).json({ message: "Failed" }); }
};
export const createSponsor = async (req: RequestWithActiveConference, res: Response) => {
    try { res.status(201).json(await sponsorRepository.create(req.activeConference.slug, { ...insertSponsorSchema.parse(req.body), conferenceId: req.activeConference.slug })); } catch (error: any) { res.status(400).json({ message: error.message }); }
};
export const updateSponsor = async (req: RequestWithActiveConference, res: Response) => {
    try { res.json(await sponsorRepository.update(req.activeConference.slug, req.params.id, req.body)); } catch (error: any) { res.status(400).json({ message: error.message }); }
};
export const deleteSponsor = async (req: RequestWithActiveConference, res: Response) => {
    try { await sponsorRepository.delete(req.activeConference.slug, req.params.id); res.json({ success: true }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};
export const deleteAllSponsors = async (req: RequestWithActiveConference, res: Response) => {
    try { await sponsorRepository.deleteAll(req.activeConference.slug); res.json({ success: true }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};