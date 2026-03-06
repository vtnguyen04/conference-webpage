import { existsSync } from "fs";
import fs from "fs/promises";
import path from "path";
export async function deleteFile(filePathRelative: string) {
    if (!filePathRelative || !filePathRelative.startsWith('/uploads/')) return;
    // Sanitize: use basename to prevent path traversal
    const filename = path.basename(filePathRelative);
    const absolutePath = path.join(process.cwd(), "public", "uploads", filename);
    // Double-check the resolved path is still within the uploads directory
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!absolutePath.startsWith(uploadsDir)) return;
    try {
        if (existsSync(absolutePath)) {
            await fs.unlink(absolutePath);
            console.log(`Deleted file: ${absolutePath}`);
        }
    } catch (error) {
        console.error(`Failed to delete file: ${absolutePath}`, error);
    }
}
