import { Document } from "@shared/schema";
import { readConferenceData, writeConferenceData } from "../dataContext";
import { BaseJsonRepository } from "./baseJsonRepository";

export class DocumentRepository extends BaseJsonRepository<Document> {
  constructor() {
    super("documents");
  }

  /**
   * Tăng lượt xem một cách an toàn (Atomic Operation)
   */
  async incrementViews(slug: string, id: string): Promise<Document | undefined> {
    const data = await readConferenceData(slug);
    if (!data) return undefined;

    const documents = data.documents;
    const index = documents.findIndex((d) => d.id === id);
    if (index === -1) return undefined;

    documents[index].views = (documents[index].views || 0) + 1;
    await writeConferenceData(slug, data);
    return documents[index];
  }
}

export const documentRepository = new DocumentRepository();
