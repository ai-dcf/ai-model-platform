
const DB_NAME = 'ai-model-app-db';
const DB_VERSION = 1;
const STORE_NAME = 'attachments';

export interface StoredAttachment {
  id: string;
  conversationId: string;
  type: 'image' | 'file';
  name: string;
  mimeType: string;
  size: number;
  data: string;
  thumbnail?: string;
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
): Promise<StoredAttachment> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const attachment: StoredAttachment = {
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
): Promise<StoredAttachment[]> {
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

export function generateThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve('');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 200;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = (height * MAX_SIZE) / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = (width * MAX_SIZE) / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = reader.result as string;
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
