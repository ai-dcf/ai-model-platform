import type { Attachment } from '@/types';

const DB_NAME = 'ai-model-app-db';
const DB_VERSION = 1;
const STORE_NAME = 'attachments';

export interface AttachmentRecord extends Attachment {
  conversationId: string;
  createdAt: string;
}

let dbInstance: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
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
}

export async function saveAttachment(
  conversationId: string,
  file: File
): Promise<AttachmentRecord> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const attachment: AttachmentRecord = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        conversationId,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        name: file.name,
        mimeType: file.type,
        size: file.size,
        data: reader.result as string,
        createdAt: new Date().toISOString(),
      };

      const request = store.add(attachment);

      request.onsuccess = () => resolve(attachment);
      request.onerror = () => reject(request.error);
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function getAttachmentsByConversation(
  conversationId: string
): Promise<AttachmentRecord[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('conversationId');

    const request = index.getAll(conversationId);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.delete(attachmentId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearAttachmentsByConversation(
  conversationId: string
): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('conversationId');

    const request = index.getAllKeys(conversationId);

    request.onsuccess = () => {
      const keys = request.result;
      keys.forEach((key) => store.delete(key));
      resolve();
    };

    request.onerror = () => reject(request.error);
  });
}
