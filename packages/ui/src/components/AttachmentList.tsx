import React from 'react';

export type AttachmentStatus = 'uploading' | 'completed' | 'error';

export interface AttachmentItem {
  /** 附件唯一标识 */
  id: string;
  /** 文件名 */
  name: string;
  /** 文件大小（字节） */
  size: number;
  /** 文件类型 (MIME) */
  mimeType: string;
  /** 文件下载/预览URL */
  url?: string;
  /** 上传状态 */
  status?: AttachmentStatus;
  /** 上传进度 0-100 */
  progress?: number;
  /** 缩略图URL（图片类） */
  thumbnailUrl?: string;
  /** 错误信息 */
  errorMessage?: string;
}

export interface AttachmentListProps {
  /** 附件列表 */
  items: AttachmentItem[];
  /** 点击下载回调 */
  onDownload?: (item: AttachmentItem) => void;
  /** 删除附件回调 */
  onRemove?: (item: AttachmentItem) => void;
  /** 重试上传回调 */
  onRetry?: (item: AttachmentItem) => void;
  /** 是否展示删除按钮 */
  showRemove?: boolean;
  /** 是否只读模式（不展示任何操作按钮） */
  readonly?: boolean;
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 是否展示文件图标 */
  showIcon?: boolean;
  /** 空状态文案 */
  emptyText?: string;
  /** 最大显示附件数，超出折叠 */
  maxVisible?: number;
  /** className */
  className?: string;
}

// 获取文件图标名称/emoji（基于MIME）
function getFileTypeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return '🗜️';
  if (mimeType.includes('json') || mimeType.includes('xml') || mimeType.startsWith('text/')) return '📃';
  return '📎';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function getFileExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot > 0 ? filename.slice(dot + 1).toUpperCase() : '';
}

const StatusIndicator: React.FC<{ status?: AttachmentStatus; progress?: number }> = ({
  status = 'completed',
  progress,
}) => {
  if (status === 'uploading') {
    return (
      <span style={{ fontSize: '12px', color: '#1677ff' }}>
        {progress != null ? `上传中 ${progress}%` : '上传中...'}
      </span>
    );
  }
  if (status === 'error') {
    return <span style={{ fontSize: '12px', color: '#ff4d4f' }}>上传失败</span>;
  }
  return null;
};

const AttachmentList: React.FC<AttachmentListProps> = ({
  items,
  onDownload,
  onRemove,
  onRetry,
  showRemove = false,
  readonly = false,
  compact = false,
  showIcon = true,
  emptyText = '暂无附件',
  maxVisible,
  className = '',
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const displayItems = maxVisible && !expanded ? items.slice(0, maxVisible) : items;
  const hasMore = maxVisible != null && items.length > maxVisible;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: compact ? '4px' : '8px',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: compact ? '8px' : '12px',
    padding: compact ? '6px 8px' : '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    background: '#fff',
    transition: 'background 0.15s',
    cursor: 'default',
  };

  const actionBtnStyle: React.CSSProperties = {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: '4px 6px',
    fontSize: '13px',
    color: '#6b7280',
    borderRadius: '4px',
    lineHeight: 1,
  };

  if (items.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '24px 16px',
          color: '#9ca3af',
          fontSize: '14px',
        }}
        className={className}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div style={containerStyle} className={className} role="list" aria-label="附件列表">
      {displayItems.map((item) => {
        const hasError = item.status === 'error';
        const isUploading = item.status === 'uploading';

        return (
          <div
            key={item.id}
            role="listitem"
            style={{
              ...rowStyle,
              borderColor: hasError ? '#ff4d4f' : isUploading ? '#d9d9d9' : '#e5e7eb',
              opacity: isUploading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isUploading) {
                (e.currentTarget as HTMLDivElement).style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = '#fff';
            }}
          >
            {/* 文件图标 */}
            {showIcon && (
              <span style={{ fontSize: compact ? '16px' : '20px', flexShrink: 0 }}>
                {getFileTypeIcon(item.mimeType)}
              </span>
            )}

            {/* 缩略图 */}
            {item.thumbnailUrl && (
              <img
                src={item.thumbnailUrl}
                alt={item.name}
                style={{
                  width: compact ? '28px' : '36px',
                  height: compact ? '28px' : '36px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  flexShrink: 0,
                }}
              />
            )}

            {/* 文件信息 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: compact ? '13px' : '14px',
                  fontWeight: 500,
                  color: '#1f2937',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={item.name}
              >
                {item.name}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#9ca3af',
                }}
              >
                <span>{formatFileSize(item.size)}</span>
                <span>{getFileExtension(item.name)}</span>
                <StatusIndicator status={item.status} progress={item.progress} />
                {hasError && item.errorMessage && (
                  <span style={{ color: '#ff4d4f' }}>{item.errorMessage}</span>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
              {!readonly && (
                <>
                  {hasError && onRetry && (
                    <button
                      type="button"
                      title="重试"
                      style={actionBtnStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRetry(item);
                      }}
                    >
                      重试
                    </button>
                  )}

                  {item.url && onDownload && !isUploading && (
                    <button
                      type="button"
                      title="下载"
                      style={actionBtnStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload(item);
                      }}
                    >
                      下载
                    </button>
                  )}

                  {showRemove && onRemove && !isUploading && (
                    <button
                      type="button"
                      title="删除"
                      style={{ ...actionBtnStyle, color: '#ff4d4f' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(item);
                      }}
                    >
                      删除
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}

      {hasMore && (
        <button
          type="button"
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            padding: '8px',
            fontSize: '13px',
            color: '#1677ff',
            textAlign: 'center',
          }}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {expanded ? '收起' : `查看全部 ${items.length} 个附件`}
        </button>
      )}
    </div>
  );
};

export { AttachmentList };
export default AttachmentList;
