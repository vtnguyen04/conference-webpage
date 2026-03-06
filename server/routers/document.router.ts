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

const router = Router();

router.get("/slug/:conferenceSlug", getDocumentsByConferenceSlug);
router.get("/:id", checkActiveConference, (req: any, res) => {
    req.params.conferenceSlug = req.activeConference.slug;
    return getDocumentById(req, res);
});
router.get("/:conferenceSlug/:id", getDocumentById);
router.post("/:conferenceSlug/:id/view", incrementDocumentViewsBySlug);
router.post("/:id/view", checkActiveConference, incrementDocumentViews);
router.get("/", checkActiveConference, getActiveConferenceDocuments);
router.post("/", checkActiveConference, createDocument);
router.put("/:id", checkActiveConference, updateDocument);
router.delete("/:id", checkActiveConference, deleteDocument);
router.delete("/admin/all", checkActiveConference, deleteAllDocuments);

export default router;
