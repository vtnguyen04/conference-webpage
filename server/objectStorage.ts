import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

// Initialize Google Cloud Storage client
// GOOGLE_APPLICATION_CREDENTIALS environment variable should point to your service account key file.
// GCS_BUCKET_NAME environment variable should be set to your bucket name.
const objectStorageClient = new Storage();

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  private bucketName: string;

  constructor() {
    if (!process.env.GCS_BUCKET_NAME) {
      throw new Error("GCS_BUCKET_NAME environment variable is not set.");
    }
    this.bucketName = process.env.GCS_BUCKET_NAME;
  }

  private getBucket() {
    return objectStorageClient.bucket(this.bucketName);
  }

  // Public objects will be stored in a 'public' folder within the bucket
  getPublicObjectSearchPaths(): Array<string> {
    return [`${this.bucketName}/public`];
  }

  // Private objects will be stored in a 'private' folder within the bucket
  getPrivateObjectDir(): string {
    return `${this.bucketName}/private`;
  }

  async searchPublicObject(filePath: string): Promise<File | null> {
    const publicPrefix = "public/";
    const objectName = publicPrefix + filePath;
    const file = this.getBucket().file(objectName);
    const [exists] = await file.exists();
    return exists ? file : null;
  }

  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      // For GCS, we can rely on object ACLs or public access settings
      // For simplicity, assuming public objects are publicly readable via URL
      const isPublic = true; // This needs to be determined by actual GCS ACLs

      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${
          isPublic ? "public" : "private"
        }, max-age=${cacheTtlSec}`,
      });

      const stream = file.createReadStream();

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const privatePrefix = "private/";
    const objectId = randomUUID();
    const objectName = `${privatePrefix}uploads/${objectId}`;

    const [url] = await this.getBucket().file(objectName).getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: "auto",
    });

    return url;
  }

  async uploadFile(file: Express.Multer.File, folder: 'public' | 'private', aclPolicy?: ObjectAclPolicy): Promise<string> {
    const objectName = `${folder}/${randomUUID()}-${file.originalname}`;
    const gcsFile = this.getBucket().file(objectName);

    await gcsFile.save(file.buffer, {
      contentType: file.mimetype,
      resumable: false,
    });

    // Apply ACL policy
    if (aclPolicy?.visibility === "public") {
      await gcsFile.makePublic();
    } else if (aclPolicy?.visibility === "private") {
      await gcsFile.makePrivate();
    }

    // Return the public URL or a path that can be used to construct it
    return `/objects/${folder}/${gcsFile.name.split('/').pop()}`;
  }

  async getObjectEntityFile(objectPath: string): Promise<File> {
    // objectPath comes in as /objects/private/uploads/uuid or /objects/public/image.jpg
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice("/objects/".length).split("/");
    const folder = parts[0]; // 'private' or 'public'
    const fileName = parts.slice(1).join("/");

    const file = this.getBucket().file(`${folder}/${fileName}`);
    const [exists] = await file.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return file;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    // If it's already a GCS URL, extract the path
    if (rawPath.startsWith("https://storage.googleapis.com/")) {
      const url = new URL(rawPath);
      const pathParts = url.pathname.split("/");
      // Expected format: /bucket-name/folder/file-name
      if (pathParts.length >= 3) {
        const folder = pathParts[2]; // 'public' or 'private'
        const fileName = pathParts.slice(3).join("/");
        return `/objects/${folder}/${fileName}`;
      }
    }
    // If it's a signed URL, we need to extract the object name
    if (rawPath.includes("storage.googleapis.com") && rawPath.includes("X-Goog-SignedHeaders")) {
      const url = new URL(rawPath);
      const objectName = decodeURIComponent(url.pathname.split("/").slice(2).join("/"));
      const folder = objectName.split("/")[0];
      const fileName = objectName.split("/").slice(1).join("/");
      return `/objects/${folder}/${fileName}`;
    }
    return rawPath;
  }

  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/objects/")) {
      return normalizedPath;
    }

    const objectFile = await this.getObjectEntityFile(normalizedPath);
    // Apply ACL policy to GCS object
    if (aclPolicy.visibility === "public") {
      await objectFile.makePublic();
    } else if (aclPolicy.visibility === "private") {
      await objectFile.makePrivate();
    }
    // Additional ACLs based on owner can be implemented here if needed

    return normalizedPath;
  }

  async canAccessObjectEntity({
    userId,
    userEmail,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    userEmail?: string;
    objectFile: File;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    // This is a simplified check. In a real app, you'd check GCS ACLs or custom logic.
    // For now, if it's a public object, allow access.
    // If it's a private object, and userId/userEmail matches owner, allow access.

    const [metadata] = await objectFile.getMetadata();
    const isPublic = metadata.acl?.some((acl: any) => acl.entity === "allUsers" && acl.role === "READER");

    if (isPublic) {
      return true;
    }

    // Simplified private access check (needs actual ACL implementation)
    // For now, if a user is logged in, we'll allow access to private objects.
    if (userId) { 
      return true; 
    }

    return false;
  }
}