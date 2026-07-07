'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

// ==================== 类型定义 ====================

/** 上传文件信息 */
export interface UploadFile {
  /** 唯一标识 */
  uid: string;
  /** 文件名 */
  name: string;
  /** 文件大小（字节） */
  size: number;
  /** 文件类型（MIME） */
  type: string;
  /** 上传进度 0-100，undefined 表示未开始 */
  percent?: number;
  /** 文件状态 */
  status: 'pending' | 'uploading' | 'done' | 'error';
  /** 文件对象 */
  originFileObj?: File;
  /** 预览 URL（本地图片等） */
  url?: string;
  /** 错误信息 */
  error?: string;
}

/** FileUpload 组件属性 */
export interface FileUploadProps {
  /** 是否允许多文件 */
  multiple?: boolean;
  /** 接受的文件类型（如 "image/*,.pdf"） */
  accept?: string;
  /** 最大文件大小（字节） */
  maxSize?: number;
  /** 最大文件数量 */
  maxCount?: number;
  /** 文件列表 */
  fileList?: UploadFile[];
  /** 文件列表变化回调 */
  onChange?: (files: UploadFile[]) => void;
  /** 上传触发前的校验，返回 false/reject 阻止上传 */
  beforeUpload?: (file: File) => boolean | Promise<boolean>;
  /** 自定义上传处理（返回 Promise），默认仅管理文件列表 */
  customRequest?: (file: File, onProgress: (percent: number) => void) => Promise<void>;
  /** 是否禁用 */
  disabled?: boolean;
  /** 拖拽上传 */
  drag?: boolean;
  /** 占位文本 */
  placeholder?: string;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** aria-label */
  'aria-label'?: string;
}

// ==================== 工具函数 ====================

let uidCounter = 0;
function generateUid(): string {
  uidCounter += 1;
  return `upload-file-${uidCounter}-${Date.now()}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileTypeIcon(type: string): string {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎬';
  if (type.startsWith('audio/')) return '🎵';
  if (type.includes('pdf')) return '📄';
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return '📦';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return '📊';
  return '📁';
}

// ==================== 样式常量 ====================

const DROP_ZONE_STYLE: React.CSSProperties = {
  border: '2px dashed #d9d9d9',
  borderRadius: 8,
  padding: '40px 24px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s',
  backgroundColor: '#fafafa',
};

const DROP_ZONE_ACTIVE_STYLE: React.CSSProperties = {
  borderColor: '#1677ff',
  backgroundColor: '#e6f4ff',
};

const DROP_ZONE_DISABLED_STYLE: React.CSSProperties = {
  cursor: 'not-allowed',
  opacity: 0.6,
};

const BTN_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 16px',
  border: '1px solid #d9d9d9',
  borderRadius: 6,
  backgroundColor: '#fff',
  cursor: 'pointer',
  fontSize: 14,
  color: '#333',
  transition: 'all 0.2s',
};

const FILE_ITEM_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 12px',
  border: '1px solid #f0f0f0',
  borderRadius: 6,
  marginTop: 6,
  backgroundColor: '#fff',
  transition: 'background-color 0.15s',
};

const PROGRESS_BAR_OUTER: React.CSSProperties = {
  width: 120,
  height: 6,
  backgroundColor: '#f0f0f0',
  borderRadius: 3,
  overflow: 'hidden',
  flexShrink: 0,
};

const PROGRESS_BAR_INNER = (percent: number, status: string): React.CSSProperties => ({
  height: '100%',
  width: `${percent}%`,
  backgroundColor: status === 'error' ? '#ff4d4f' : '#1677ff',
  borderRadius: 3,
  transition: 'width 0.3s ease',
});

// ==================== FileUpload 组件 ====================

/**
 * FileUpload — 文件上传组件。
 *
 * 支持单文件/多文件上传，拖拽上传，文件大小/类型校验，上传进度展示。
 * 可通过 beforeUpload 自定义校验逻辑，customRequest 自定义上传请求。
 *
 * @example
 * <FileUpload
 *   multiple
 *   accept="image/*"
 *   maxSize={5 * 1024 * 1024}
 *   maxCount={5}
 *   onChange={(files) => console.log(files)}
 * />
 */
export function FileUpload({
  multiple = false,
  accept,
  maxSize,
  maxCount,
  fileList: controlledFileList,
  onChange,
  beforeUpload,
  customRequest,
  disabled = false,
  drag = false,
  placeholder = '点击或拖拽文件到此区域上传',
  className,
  style,
  'aria-label': ariaLabel,
}: FileUploadProps) {
  const [internalFileList, setInternalFileList] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const isControlled = controlledFileList !== undefined;
  const fileList = isControlled ? controlledFileList : internalFileList;

  const updateFileList = useCallback(
    (newList: UploadFile[]) => {
      if (!isControlled) {
        setInternalFileList(newList);
      }
      onChange?.(newList);
    },
    [isControlled, onChange],
  );

  /** 添加文件 */
  const addFiles = useCallback(
    async (rawFiles: FileList | File[]) => {
      const files = Array.from(rawFiles);

      // 限制文件数量
      if (!multiple && fileList.length > 0) {
        // 单文件模式替换
      }

      const remaining = maxCount ? maxCount - (multiple ? fileList.length : 0) : files.length;
      const firstFile = files[0];

      const filesToAdd: File[] = multiple
        ? files.slice(0, Math.max(remaining, 0))
        : (firstFile ? [firstFile] : []);

      if (filesToAdd.length === 0) return;

      for (const file of filesToAdd) {
        // 校验
        if (beforeUpload) {
          try {
            const result = beforeUpload(file);
            const canUpload = result instanceof Promise ? await result : result;
            if (!canUpload) continue;
          } catch {
            continue;
          }
        }

        // 大小校验
        if (maxSize && file.size > maxSize) {
          const errFile: UploadFile = {
            uid: generateUid(),
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'error',
            originFileObj: file,
            error: `文件大小 ${formatFileSize(file.size)} 超过限制 ${formatFileSize(maxSize)}`,
          };

          const newList = multiple ? [...fileList, errFile] : [errFile];
          updateFileList(newList);
          continue;
        }

        // 生成预览 URL（图片）
        let url: string | undefined;
        if (file.type.startsWith('image/')) {
          url = URL.createObjectURL(file);
        }

        const uploadFile: UploadFile = {
          uid: generateUid(),
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'pending',
          originFileObj: file,
          url,
        };

        const intermediateList = multiple
          ? [...fileList, uploadFile]
          : [uploadFile];
        updateFileList(intermediateList);

        // 执行上传
        if (customRequest) {
          uploadFile.status = 'uploading';
          uploadFile.percent = 0;
          updateFileList(multiple ? [...fileList, uploadFile] : [uploadFile]);

          try {
            await customRequest(file, (percent: number) => {
              uploadFile.percent = percent;
              updateFileList([...fileList, uploadFile]);
            });
            uploadFile.status = 'done';
            uploadFile.percent = 100;
            updateFileList([...fileList, uploadFile]);
          } catch (err) {
            uploadFile.status = 'error';
            uploadFile.error = err instanceof Error ? err.message : '上传失败';
            updateFileList([...fileList, uploadFile]);
          }
        } else {
          // 无 customRequest 直接标记完成
          uploadFile.status = 'done';
          updateFileList(
            multiple
              ? [...fileList, uploadFile]
              : [uploadFile],
          );
        }
      }
    },
    [multiple, maxSize, maxCount, fileList, beforeUpload, customRequest, updateFileList],
  );

  /** 删除文件 */
  const removeFile = useCallback(
    (uid: string) => {
      const removed = fileList.find((f) => f.uid === uid);
      // 释放对象 URL
      if (removed?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(removed.url);
      }
      const newList = fileList.filter((f) => f.uid !== uid);
      updateFileList(newList);
    },
    [fileList, updateFileList],
  );

  /** 重试上传 */
  const retryUpload = useCallback(
    async (uid: string) => {
      const file = fileList.find((f) => f.uid === uid) as UploadFile | undefined;
      const originFile = file?.originFileObj;
      if (!file || !originFile || !customRequest) return;

      file.status = 'uploading';
      file.percent = 0;
      file.error = undefined;
      updateFileList([...fileList]);

      try {
        await customRequest(originFile, (percent: number) => {
          file.percent = percent;
          updateFileList([...fileList]);
        });
        file.status = 'done';
        file.percent = 100;
        updateFileList([...fileList]);
      } catch (err) {
        file.status = 'error';
        file.error = err instanceof Error ? err.message : '上传失败';
        updateFileList([...fileList]);
      }
    },
    [fileList, customRequest, updateFileList],
  );

  // 清理 blob URL
  useEffect(() => {
    return () => {
      for (const f of fileList) {
        if (f.url?.startsWith('blob:')) {
          URL.revokeObjectURL(f.url);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========== 拖拽事件处理 ==========
  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setDragActive(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setDragActive(true);
    },
    [disabled],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (disabled) return;
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [disabled, addFiles],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
      // 重置 input 允许重复选择同一文件
      e.target.value = '';
    },
    [addFiles],
  );

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const statusIcon = (status: string): string => {
    switch (status) {
      case 'done':
        return '✅';
      case 'error':
        return '❌';
      case 'uploading':
        return '⏳';
      default:
        return '⏸️';
    }
  };

  // ========== 渲染 ==========

  const dropZoneStyle: React.CSSProperties = {
    ...DROP_ZONE_STYLE,
    ...(dragActive ? DROP_ZONE_ACTIVE_STYLE : {}),
    ...(disabled ? DROP_ZONE_DISABLED_STYLE : {}),
  };

  return (
    <div
      className={className}
      style={{
        width: '100%',
        ...style,
      }}
      aria-label={ariaLabel || '文件上传区域'}
    >
      {/* 上传区域 */}
      {drag ? (
        <div
          style={dropZoneStyle}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
          role="button"
          aria-label={ariaLabel || '拖拽上传区域'}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleClick();
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }}>📁</div>
          <div style={{ color: '#666', fontSize: 14 }}>{placeholder}</div>
          <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
            支持格式：{accept || '所有文件'}
            {maxSize && ` · 单文件上限 ${formatFileSize(maxSize)}`}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            style={{ display: 'none' }}
            onChange={handleInputChange}
            aria-hidden="true"
          />
          <button
            type="button"
            style={BTN_STYLE}
            onClick={handleClick}
            disabled={disabled}
            aria-label={ariaLabel || '选择文件上传'}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#1677ff';
              (e.currentTarget as HTMLButtonElement).style.color = '#1677ff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#d9d9d9';
              (e.currentTarget as HTMLButtonElement).style.color = '#333';
            }}
          >
            📤 选择文件
          </button>
          <span style={{ color: '#999', fontSize: 12 }}>
            {accept ? `支持 ${accept}` : '所有文件'}
            {maxSize && ` · 单文件上限 ${formatFileSize(maxSize)}`}
          </span>
        </div>
      )}

      {/* 文件列表 */}
      {fileList.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {fileList.map((file) => (
            <div
              key={file.uid}
              style={{
                ...FILE_ITEM_STYLE,
                ...(file.status === 'error'
                  ? { borderColor: '#ffccc7', backgroundColor: '#fff2f0' }
                  : {}),
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = '#fafafa';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = '#fff';
              }}
              role="listitem"
            >
              {/* 图标 */}
              <span style={{ fontSize: 20, flexShrink: 0 }}>
                {file.type.startsWith('image/') && file.url ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }}
                  />
                ) : (
                  getFileTypeIcon(file.type)
                )}
              </span>

              {/* 文件信息 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    color: '#333',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={file.name}
                >
                  {file.name}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 11,
                    color: '#999',
                    marginTop: 2,
                  }}
                >
                  <span>{formatFileSize(file.size)}</span>
                  <span>{statusIcon(file.status)}</span>
                  <span>{file.status === 'done' ? '上传完成' : file.status === 'error' ? file.error || '上传失败' : file.status === 'uploading' ? `上传中 ${file.percent}%` : '等待上传'}</span>
                </div>
                {/* 进度条 */}
                {file.status === 'uploading' && (
                  <div style={{ marginTop: 4 }}>
                    <div style={PROGRESS_BAR_OUTER}>
                      <div style={PROGRESS_BAR_INNER(file.percent ?? 0, file.status)} />
                    </div>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {file.status === 'error' && customRequest && (
                  <button
                    type="button"
                    onClick={() => retryUpload(file.uid)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: 16,
                      padding: 2,
                      color: '#1677ff',
                    }}
                    aria-label={`重试上传 ${file.name}`}
                  >
                    🔄
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(file.uid)}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: 16,
                    padding: 2,
                    color: '#999',
                  }}
                  aria-label={`删除 ${file.name}`}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
