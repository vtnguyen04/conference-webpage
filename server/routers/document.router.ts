import { Router } from "express";
import {
    createDocument,
    deleteAllDocuments,
    deleteDocument,
    getActiveConferenceDocuments,
    getDocumentById,
    getDocumentsByConferenceSlug,
    incrementDocumentViews,
    incrementDocumentViewsBySlug,
    updateDocument,
} from "../controllers/document.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";
import { isAuthenticated } from "../sessionAuth";

const router = Router();

// Public read routes
router.get("/slug/:conferenceSlug", getDocumentsByConferenceSlug);
router.get("/:id", checkActiveConference, (req: any, res) => {
    req.params.conferenceSlug = req.activeConference.slug;
    return getDocumentById(req, res);
});
router.get("/:conferenceSlug/:id", getDocumentById);
router.post("/:conferenceSlug/:id/view", incrementDocumentViewsBySlug);
router.post("/:id/view", checkActiveConference, incrementDocumentViews);
router.get("/", checkActiveConference, getActiveConferenceDocuments);

// Protected write routes
router.post("/", isAuthenticated, checkActiveConference, createDocument);
router.put("/:id", isAuthenticated, checkActiveConference, updateDocument);
router.delete("/:id", isAuthenticated, checkActiveConference, deleteDocument);
router.delete("/admin/all", isAuthenticated, checkActiveConference, deleteAllDocuments);

export default router;
