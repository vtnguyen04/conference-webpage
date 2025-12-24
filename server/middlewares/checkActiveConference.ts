
import { conferenceRepository } from '../repositories/conferenceRepository';
import { type Request, type Response, type NextFunction } from "express";

export interface RequestWithActiveConference extends Request {
  activeConference?: any; 
}

export const checkActiveConference = async (req: RequestWithActiveConference, res: Response, next: NextFunction) => {
  const activeConference = await conferenceRepository.getActive();
  if (!activeConference) {
    return res.status(404).json({ message: "No active conference found." });
  }
  req.activeConference = activeConference;

  const conferenceSlugParam = req.params.conferenceSlug;

  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    if (conferenceSlugParam && conferenceSlugParam !== activeConference.slug) {
      return res.status(403).json({ message: "Only the active conference can be modified." });
    }
  }
  next();
};
