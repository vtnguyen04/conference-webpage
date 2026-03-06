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
import { isAuthenticated } from "../sessionAuth";
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
// Protected: uploads and admin stats require authentication
router.post('/upload', isAuthenticated, upload.single('image'), uploadImage);
router.post('/upload-pdf', isAuthenticated, upload.single('pdf'), uploadPdf);
router.post('/upload/banners', isAuthenticated, upload.array('banners', 5), uploadBanners);
router.delete('/upload', isAuthenticated, deleteUpload);
router.get('/admin/stats', isAuthenticated, checkActiveConference, getAdminStats);
router.get('/analytics', isAuthenticated, checkActiveConference, getAdminStats);
// Protected: contact message management requires authentication
router.get('/contact-messages', isAuthenticated, getContactMessagesPaginated);
// Public: contact form submission
router.post('/contact', createNewContactMessage);
export default router;
