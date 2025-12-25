import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
export async function deleteFile(filePathRelative: string) {
    if (filePathRelative && filePathRelative.startsWith('/uploads/')) {
        const absolutePath = path.join(process.cwd(), "public", filePathRelative);
        try {
            if (existsSync(absolutePath)) {
                await fs.unlink(absolutePath);
                console.log(`Deleted file: ${absolutePath}`);
            }
        } catch (error) {
            console.error(`Failed to delete file: ${absolutePath}`, error);
        }
    }
}
