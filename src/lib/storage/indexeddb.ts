import type { Attachment } from '@/types';

const DB_NAME = 'ai-model-app-db';
const DB_VERSION = 1;
const STORE_NAME = 'attachments';

export interface AttachmentRecord extends Attachment {
  conversationId: string;
  createdAt: string;
}

class IndexedDBAPI {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private async init(): Promise<void> {
    if (this.db) return;
    
    return new Promise((resolve, reject) => {
      if (this.initPromise) {
        this.initPromise.then(() => resolve());
        return;
      }

      this.initPromise = new Promise((res, rej) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => rej(request.error);
        request.onsuccess = () => {
          this.db = request.result;
          res();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('conversationId', 'conversationId', { unique: false });
            store.createIndex('createdAt', 'createdAt', { unique: false });
          }
        };
      });

      this.initPromise.then(resolve).catch(reject);
    });
  }

  private async getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    await this.init();
    const transaction = this.db!.transaction(STORE_NAME, mode);
    return transaction.objectStore(STORE_NAME);
  }

  async save(attachment: AttachmentRecord): Promise<void> {
    const store = await this.getStore('readwrite');
    
    return new Promise((resolve, reject) => {
      const request = store.put(attachment);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(id: string): Promise<AttachmentRecord | undefined> {
    const store = await this.getStore('readonly');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getByConversation(conversationId: string): Promise<AttachmentRecord[]> {
    const store = await this.getStore('readonly');
    const index = store.index('conversationId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(conversationId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(): Promise<AttachmentRecord[]> {
    const store = await this.getStore('readonly');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: string): Promise<void> {
    const store = await this.getStore('readwrite');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteByConversation(conversationId: string): Promise<void> {
    const attachments = await this.getByConversation(conversationId);
    const store = await this.getStore('readwrite');
    
    const promises = attachments.map(attachment => {
      return new Promise<void>((resolve, reject) => {
        const request = store.delete(attachment.id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
    
    await Promise.all(promises);
  }
}

export const indexedDBAPI = new IndexedDBAPI();
