import { indexedDBAPI, type AttachmentRecord } from './storage/indexeddb';

export async function saveAttachment(
  conversationId: string,
  file: File
): Promise<AttachmentRecord> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
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

      indexedDBAPI.save(attachment).then(() => resolve(attachment)).catch(reject);
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function getAttachmentsByConversation(
  conversationId: string
): Promise<AttachmentRecord[]> {
  return indexedDBAPI.getByConversation(conversationId);
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  return indexedDBAPI.delete(attachmentId);
}

export async function clearAttachmentsByConversation(
  conversationId: string
): Promise<void> {
  return indexedDBAPI.deleteByConversation(conversationId);
}

export { type AttachmentRecord } from './storage/indexeddb';
