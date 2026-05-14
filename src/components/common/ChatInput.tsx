'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, Upload, Mic, MicOff } from 'lucide-react';
import FilePreview from '@/components/common/FilePreview';
import { saveAttachment, type AttachmentRecord } from '@/lib/attachment';

interface ChatInputProps {
  value: string;
  attachments: AttachmentRecord[];
  isLoading: boolean;
  isRecording: boolean;
  conversationId: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function ChatInput({
  value,
  attachments,
  isLoading,
  isRecording,
  conversationId,
  onChange,
  onSend,
  onRemoveAttachment,
  onStartRecording,
  onStopRecording,
}: ChatInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList) => {
      setError('');

      const validFiles: File[] = [];
      const newErrors: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > MAX_FILE_SIZE) {
          newErrors.push(`"${file.name}" 超过 10MB 限制`);
          continue;
        }

        const isImage = file.type.startsWith('image/');
        const isAccepted =
          isImage ||
          file.type === 'application/pdf' ||
          ACCEPTED_TYPES.includes(`.${file.name.split('.').pop()?.toLowerCase()}`);

        if (!isAccepted) {
          newErrors.push(`不支持 "${file.name}" 格式`);
          continue;
        }

        validFiles.push(file);
      }

      if (newErrors.length > 0) {
        setError(newErrors[0]);
        setTimeout(() => setError(''), 3000);
      }

      for (const file of validFiles) {
        try {
          await saveAttachment(conversationId, file);
        } catch (err) {
          console.error('Failed to save attachment:', err);
          setError('文件上传失败，请重试');
          setTimeout(() => setError(''), 3000);
        }
      }

      window.dispatchEvent(new CustomEvent('attachment-added'));
    },
    [conversationId]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const canSend = (value.trim() || attachments.length > 0) && !isLoading;

  return (
    <div
      className={`relative transition-all duration-200 ${
        isDragging ? 'scale-[1.02]' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {error && (
        <div className="absolute -top-10 left-0 right-0 text-sm text-error text-center bg-error/10 py-1.5 rounded-lg animate-fade-in">
          {error}
        </div>
      )}

      {isDragging && (
        <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary rounded-2xl flex items-center justify-center z-10 backdrop-blur-sm">
          <span className="text-primary font-medium text-lg">拖拽文件到此处上传</span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <FilePreview
          attachments={attachments}
          onRemove={onRemoveAttachment}
        />

        <div className="bg-white/5 border border-border/50 rounded-2xl p-4 min-h-[80px] max-h-[160px] transition-all duration-200 focus-within:border-primary focus-within:shadow-sm focus-within:shadow-primary/10 hover:border-border">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (canSend) onSend();
              }
            }}
            placeholder="输入消息..."
            className="w-full bg-transparent border-none outline-none resize-none text-text placeholder:text-text-dim text-base leading-relaxed"
            rows={1}
          />
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center bg-surface-lighter text-text-muted transition-all duration-200 ease-out hover:scale-[1.02] hover:bg-surface-lighter/80 active:scale-[0.95]"
              title="上传文件"
            >
              <Upload className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {isRecording && (
              <span className="text-xs text-error animate-pulse hidden sm:inline mr-1">
                松开发送
              </span>
            )}

            <button
              onMouseDown={onStartRecording}
              onMouseUp={onStopRecording}
              onTouchStart={(e) => {
                e.preventDefault();
                onStartRecording();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                onStopRecording();
              }}
              className={`w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-200 ease-out touch-none select-none hover:scale-[1.02] active:scale-[0.95] ${
                isRecording
                  ? 'bg-error text-white animate-pulse'
                  : 'bg-surface-lighter text-text-muted hover:bg-surface-lighter/80'
              }`}
              title={isRecording ? '松开发送' : '按住说话'}
            >
              {isRecording ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={onSend}
              disabled={!canSend}
              className={`w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.95] ${
                canSend
                  ? 'bg-gradient-to-br from-primary to-primary-dark text-white hover:shadow-lg hover:shadow-primary/25'
                  : 'bg-surface-lighter text-text-dim cursor-not-allowed'
              }`}
              title="发送消息"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
