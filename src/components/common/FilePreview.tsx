'use client';

import { X, FileText } from 'lucide-react';
import type { Attachment } from '@/types';

interface FilePreviewProps {
  attachments: Attachment[];
  onRemove: (attachmentId: string) => void;
}

export default function FilePreview({ attachments, onRemove }: FilePreviewProps) {
  if (attachments.length === 0) return null;

  const maxDisplay = 9;
  const displayAttachments = attachments.slice(0, maxDisplay);
  const remainingCount = attachments.length - maxDisplay;

  return (
    <div className="glass-card rounded-2xl p-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {displayAttachments.map((attachment) => (
          <div
            key={attachment.id}
            className="relative group rounded-xl overflow-hidden bg-surface-lighter border border-border/50 transition-all duration-200 hover:border-border hover:shadow-sm"
          >
            {attachment.type === 'image' ? (
              <div className="aspect-square">
                <img
                  src={attachment.data}
                  alt={attachment.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square flex flex-col items-center justify-center p-2">
                <FileText className="w-6 h-6 md:w-7 md:h-7 text-text-muted mb-1" />
                <span className="text-xs text-text-muted truncate w-full text-center px-1">
                  {attachment.name.length > 8
                    ? attachment.name.substring(0, 6) + '...'
                    : attachment.name}
                </span>
              </div>
            )}

            <button
              onClick={() => onRemove(attachment.id)}
              className="absolute top-1.5 right-1.5 w-5 h-5 bg-error/90 hover:bg-error rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm"
              title="删除文件"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}

        {remainingCount > 0 && (
          <div className="aspect-square rounded-xl bg-surface-lighter border border-border/50 flex items-center justify-center">
            <span className="text-sm font-medium text-text-muted">+{remainingCount}</span>
          </div>
        )}
      </div>
    </div>
  );
}
