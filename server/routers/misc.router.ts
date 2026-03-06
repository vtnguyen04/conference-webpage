import { Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import {
    createNewContactMessage,
    deleteUpload,
    getAdminStats,
    getContactMessagesPaginated,
    uploadBanners,
    uploadImage,
    uploadPdf
} from "../controllers/misc.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";
const router = Router();
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});
router.post('/upload', upload.single('image'), uploadImage);
router.post('/upload-pdf', upload.single('pdf'), uploadPdf);
router.post('/upload/banners', upload.array('banners', 5), uploadBanners);
router.delete('/upload', deleteUpload);
router.get('/admin/stats', checkActiveConference, getAdminStats);
router.get('/analytics', checkActiveConference, getAdminStats);
router.post('/contact', createNewContactMessage);
router.get('/contact-messages', getContactMessagesPaginated);
router.get("/uploads/:filePath(*)", (req, res) => {
    const filePath = req.params.filePath;
    const absolutePath = path.join(uploadDir, filePath);
    if (fs.existsSync(absolutePath)) {
        res.sendFile(absolutePath);
    } else {
        res.status(404).json({ error: "File not found" });
    }
});
export default router;
