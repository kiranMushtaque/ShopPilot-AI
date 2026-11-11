import { db } from '../db/store';
import { KnowledgeDocument, KnowledgeChunk } from '../types';

export class KnowledgeService {
  public async searchKnowledge(query: string): Promise<KnowledgeChunk[]> {
    return db.searchKnowledgeBase(query);
  }

  public async getAllDocuments(): Promise<KnowledgeDocument[]> {
    return db.getKnowledgeDocs();
  }

  public async saveDocument(docData: Partial<KnowledgeDocument>): Promise<KnowledgeDocument> {
    return db.saveKnowledgeDoc(docData);
  }
}

export const knowledgeService = new KnowledgeService();
