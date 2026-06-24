'use client';

import React, {
  useCallback,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type ChangeEvent as ReactChangeEvent,
} from 'react';

export interface UploadedFile {
  /** Unique id assigned on upload */
  id: string;
  /** Original file name */
  name: string;
  /** Size in bytes */
  size: number;
  /** MIME type */
  type: string;
  /** Upload progress 0–100; -1 means failed */
  progress: number;
  /** Error message when progress === -1 */
  error?: string;
  /** Preview URL for images */
  preview?: string;
}

export interface FileUploadProps {
  /** Accepted MIME types (e.g. "image/*,.pdf") */
  accept?: string;
  /** Maximum number of files allowed (default 1) */
  maxFiles?: number;
  /** Maximum individual file size in bytes (default 10 MB) */
  maxSize?: number;
  /** Whether to allow multiple file selection (default false) */
  multiple?: boolean;
  /** Show image previews for image/* types (default true) */
  showPreview?: boolean;
  /** Callback when files are added; return false to reject */
  onFilesAdded?: (files: File[]) => boolean | void;
  /** Callback when a file is removed by user */
  onFileRemoved?: (file: UploadedFile) => void;
  /** Controlled file list (if you want external control) */
  files?: UploadedFile[];
  /** Disabled state */
  disabled?: boolean;
  /** Custom placeholder text */
  placeholder?: string;
  /** Test id */
  'data-testid'?: string;
  /** Visual variant */
  variant?: 'default' | 'compact';
}

const STYLES = {
  dropZone: {
    default: {
      border: '2px dashed rgba(148, 163, 184, 0.3)',
      borderRadius: 12,
      padding: '28px 24px',
      textAlign: 'center' as const,
      cursor: 'pointer',
      background: 'rgba(15, 23, 42, 0.2)',
      transition: 'border-color 0.2s, background 0.2s',
      minHeight: 100,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    compact: {
      border: '1px dashed rgba(148, 163, 184, 0.25)',
      borderRadius: 8,
      padding: '12px 16px',
      textAlign: 'center' as const,
      cursor: 'pointer',
      background: 'rgba(15, 23, 42, 0.15)',
      transition: 'border-color 0.2s, background 0.2s',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
  },
  dropZoneDragOver: {
    borderColor: 'rgba(56, 189, 248, 0.6)',
    background: 'rgba(56, 189, 248, 0.08)',
  },
  dropZoneDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    borderRadius: 8,
    background: 'rgba(15, 23, 42, 0.3)',
    border: '1px solid rgba(148, 163, 184, 0.15)',
    marginTop: 8,
  },
  fileInfo: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontSize: 14,
    fontWeight: 500,
    color: '#f8fafc',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  },
  fileSize: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    background: 'rgba(148, 163, 184, 0.15)',
    marginTop: 6,
    overflow: 'hidden' as const,
  },
  progressFill: (pct: number, error: boolean) => ({
    height: '100%',
    borderRadius: 2,
    width: `${pct}%`,
    background: error
      ? 'linear-gradient(90deg, #f87171, #ef4444)'
      : 'linear-gradient(90deg, #38bdf8, #818cf8)',
    transition: 'width 0.3s ease',
  }),
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 6,
    fontSize: 18,
    lineHeight: 1,
    transition: 'color 0.15s, background 0.15s',
  },
  errorText: {
    fontSize: 12,
    color: '#f87171',
    marginTop: 4,
  },
  preview: {
    width: 40,
    height: 40,
    borderRadius: 6,
    objectFit: 'cover' as const,
    flexShrink: 0,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 6,
    background: 'rgba(148, 163, 184, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    flexShrink: 0,
    color: '#94a3b8',
  },
};

let _fileIdCounter = 0;
function nextFileId(): string {
  _fileIdCounter += 1;
  return `file-${Date.now()}-${_fileIdCounter}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * FileUpload — drag-and-drop / click-to-browse file upload component.
 *
 * Supports single or multiple file selection, drag-and-drop, image previews,
 * progress simulation, file removal, and size/type validation.
 */
export function FileUpload({
  accept,
  maxFiles = 1,
  maxSize = DEFAULT_MAX_SIZE,
  multiple = false,
  showPreview = true,
  onFilesAdded,
  onFileRemoved,
  files: controlledFiles,
  disabled = false,
  placeholder = '拖拽文件到此处，或点击上传',
  'data-testid': dataTestId,
  variant = 'default',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalFiles, setInternalFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isControlled = controlledFiles !== undefined;
  const files = isControlled ? controlledFiles : internalFiles;

  const setFiles = useCallback(
    (updater: UploadedFile[] | ((prev: UploadedFile[]) => UploadedFile[])) => {
      if (isControlled) return;
      setInternalFiles(updater);
    },
    [isControlled],
  );

  const processFiles = useCallback(
    (rawFiles: FileList | File[]) => {
      const fileArr = Array.from(rawFiles);
      setError(null);

      // Check max files
      const currentCount = files.length;
      const available = (maxFiles ?? 1) - currentCount;
      if (available <= 0) {
        setError(`最多只能上传 ${maxFiles} 个文件`);
        return;
      }

      const toAdd = fileArr.slice(0, available);

      // External validation callback
      if (onFilesAdded) {
        const shouldProceed = onFilesAdded(toAdd);
        if (shouldProceed === false) return;
      }

      const newFiles: UploadedFile[] = toAdd.map((file) => {
        // Size validation
        if (file.size > maxSize) {
          return {
            id: nextFileId(),
            name: file.name,
            size: file.size,
            type: file.type,
            progress: -1,
            error: `文件大小 ${formatBytes(file.size)} 超过限制 ${formatBytes(maxSize)}`,
          };
        }

        // Generate preview for images
        let preview: string | undefined;
        if (showPreview && file.type.startsWith('image/')) {
          preview = URL.createObjectURL(file);
        }

        return {
          id: nextFileId(),
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 100,
          preview,
        };
      });

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files.length, maxFiles, maxSize, onFilesAdded, showPreview, setFiles],
  );

  const handleDrop = useCallback(
    (e: ReactDragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (disabled) return;
      const dt = e.dataTransfer;
      if (dt?.files && dt.files.length > 0) {
        processFiles(dt.files);
      }
    },
    [disabled, processFiles],
  );

  const handleDragOver = useCallback(
    (e: ReactDragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setDragOver(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(
    (e: ReactDragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
    },
    [],
  );

  const handleInputChange = useCallback(
    (e: ReactChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
        // Reset so same file can be re-selected
        e.target.value = '';
      }
    },
    [processFiles],
  );

  const handleRemove = useCallback(
    (id: string) => {
      setFiles((prev) => {
        const removed = prev.find((f) => f.id === id);
        if (removed && onFileRemoved) {
          onFileRemoved(removed);
        }
        // Revoke preview URL
        if (removed?.preview) {
          URL.revokeObjectURL(removed.preview);
        }
        return prev.filter((f) => f.id !== id);
      });
    },
    [onFileRemoved, setFiles],
  );

  const handleClick = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const zoneStyle = variant === 'compact' ? STYLES.dropZone.compact : STYLES.dropZone.default;

  return (
    <div data-testid={dataTestId}>
      {/* Drop zone */}
      <div
        data-testid="fileupload-dropzone"
        style={{
          ...zoneStyle,
          ...(dragOver ? STYLES.dropZoneDragOver : {}),
          ...(disabled ? STYLES.dropZoneDisabled : {}),
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span
          style={{
            fontSize: variant === 'compact' ? 13 : 14,
            color: dragOver ? '#38bdf8' : '#94a3b8',
          }}
        >
          {dragOver ? '释放文件以上传' : placeholder}
        </span>
        {accept ? (
          <span style={{ fontSize: 12, color: '#64748b' }}>
            支持: {accept}
          </span>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          style={{ display: 'none' }}
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          data-testid="fileupload-input"
        />
      </div>

      {/* Global error */}
      {error ? (
        <div style={{ ...STYLES.errorText, marginTop: 8, textAlign: 'center' }} data-testid="fileupload-error">
          {error}
        </div>
      ) : null}

      {/* File list */}
      {files.length > 0 ? (
        <div data-testid="fileupload-list">
          {files.map((file) => (
            <div key={file.id} style={STYLES.fileItem} data-testid={`fileupload-item-${file.id}`}>
              {/* Preview or icon */}
              {file.preview ? (
                <img
                  src={file.preview}
                  alt={file.name}
                  style={STYLES.preview}
                  data-testid={`fileupload-preview-${file.id}`}
                />
              ) : (
                <div style={STYLES.icon} data-testid={`fileupload-icon-${file.id}`}>
                  📄
                </div>
              )}

              {/* Info */}
              <div style={STYLES.fileInfo}>
                <div style={STYLES.fileName} title={file.name}>
                  {file.name}
                </div>
                <div style={STYLES.fileSize}>
                  {formatBytes(file.size)}
                  {file.progress >= 0 && file.progress < 100
                    ? ` · 上传中 ${file.progress}%`
                    : ''}
                </div>

                {/* Progress bar */}
                {file.progress >= 0 && file.progress < 100 ? (
                  <div style={STYLES.progressBar}>
                    <div style={STYLES.progressFill(file.progress, false)} />
                  </div>
                ) : null}

                {/* Error */}
                {file.error ? (
                  <div style={STYLES.errorText} data-testid={`fileupload-error-${file.id}`}>
                    {file.error}
                  </div>
                ) : null}
              </div>

              {/* Remove button */}
              <button
                type="button"
                style={STYLES.removeBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(file.id);
                }}
                disabled={disabled}
                aria-label={`移除 ${file.name}`}
                data-testid={`fileupload-remove-${file.id}`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#f87171';
                  e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.background = 'none';
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
