'use client';

import React, { useState, useCallback, useEffect } from 'react';

export interface ImageItem {
  /** Image source URL */
  src: string;
  /** Alt text */
  alt?: string;
  /** Thumbnail URL (defaults to src) */
  thumb?: string;
  /** Optional caption */
  caption?: string;
}

export interface ImagePreviewProps {
  /** Array of images to display */
  images: ImageItem[];
  /** Initial image index to show */
  initialIndex?: number;
  /** Thumbnail size in pixels */
  thumbSize?: number;
  /** Gap between thumbnails in px */
  thumbGap?: number;
  /** Width of the preview lightbox */
  previewWidth?: number;
  /** Max height of preview lightbox */
  previewMaxHeight?: number;
  /** Whether to show navigation arrows */
  showArrows?: boolean;
  /** Whether to show thumbnail strip */
  showThumbnails?: boolean;
  /** Whether to show image counter "1 / 5" */
  showCounter?: boolean;
  /** Whether to close lightbox on backdrop click */
  closeOnBackdrop?: boolean;
  /** Whether to close lightbox on Escape key */
  closeOnEscape?: boolean;
  /** Called when lightbox opens */
  onOpen?: (index: number) => void;
  /** Called when lightbox closes */
  onClose?: () => void;
  /** Called when image changes */
  onChange?: (index: number) => void;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Render mode: 'grid' shows a thumbnail grid, 'strip' shows horizontal scroll strip, 'single' shows one thumbnail */
  mode?: 'grid' | 'strip' | 'single';
  /** Columns in grid mode */
  gridCols?: number;
  /** Image fit mode in lightbox */
  fit?: 'contain' | 'cover';
  /** Image border radius in px */
  borderRadius?: number;
  /** Placeholder shown while image loads */
  placeholder?: React.ReactNode;
  /** Error fallback when image fails to load */
  errorFallback?: React.ReactNode;
}

const BACKDROP_STYLE: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  background: 'rgba(0,0,0,0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: 'imagePreviewFadeIn 0.2s ease',
};

const COUNTER_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  left: '50%',
  transform: 'translateX(-50%)',
  color: '#fff',
  fontSize: 14,
  fontWeight: 500,
  background: 'rgba(0,0,0,0.5)',
  padding: '4px 12px',
  borderRadius: 999,
  zIndex: 2,
  userSelect: 'none',
};

const NAV_BUTTON_BASE: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 2,
  background: 'rgba(255,255,255,0.15)',
  border: 'none',
  color: '#fff',
  width: 44,
  height: 44,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: 20,
  transition: 'background 0.15s',
  backdropFilter: 'blur(4px)',
};

const CLOSE_BUTTON_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 16,
  zIndex: 2,
  background: 'rgba(255,255,255,0.15)',
  border: 'none',
  color: '#fff',
  width: 40,
  height: 40,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: 22,
  transition: 'background 0.15s',
  backdropFilter: 'blur(4px)',
};

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function ImagePreview({
  images,
  initialIndex = 0,
  thumbSize = 64,
  thumbGap = 8,
  previewWidth = 900,
  previewMaxHeight = 600,
  showArrows = true,
  showThumbnails = true,
  showCounter = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  onOpen,
  onClose,
  onChange,
  className,
  style,
  mode = 'strip',
  gridCols = 4,
  fit = 'contain',
  borderRadius = 8,
  placeholder,
  errorFallback,
}: ImagePreviewProps) {
  const safeIndex = Math.max(0, Math.min(initialIndex, images.length - 1));
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const currentIndex = lightboxIndex ?? safeIndex;
  const isOpen = lightboxIndex !== null;

  const openLightbox = useCallback(
    (idx: number) => {
      setLightboxIndex(idx);
      onOpen?.(idx);
    },
    [onOpen]
  );

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    onClose?.();
  }, [onClose]);

  const goNext = useCallback(() => {
    const next = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    setLightboxIndex(next);
    onChange?.(next);
  }, [currentIndex, images.length, onChange]);

  const goPrev = useCallback(() => {
    const prev = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    setLightboxIndex(prev);
    onChange?.(prev);
  }, [currentIndex, images.length, onChange]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape' && closeOnEscape) closeLightbox();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, goNext, goPrev, closeLightbox, closeOnEscape]);

  if (images.length === 0) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          color: '#94a3b8',
          fontSize: 14,
          ...style,
        }}
      >
        No images
      </div>
    );
  }

  const currentImage = images[currentIndex]!;

  const ThumbImage = ({
    item,
    index,
    size,
  }: {
    item: ImageItem;
    index: number;
    size: number;
  }) => {
    const [failed, setFailed] = useState(false);
    const isActive = index === currentIndex && isOpen;
    const src = item.thumb || item.src;

    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={item.alt || `Image ${index + 1}`}
        onClick={() => openLightbox(index)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') openLightbox(index);
        }}
        style={{
          flexShrink: 0,
          width: size,
          height: size,
          borderRadius,
          overflow: 'hidden',
          cursor: 'pointer',
          border: isActive ? '2px solid #3b82f6' : '2px solid transparent',
          opacity: isActive ? 1 : 0.75,
          transition: 'opacity 0.15s, border-color 0.15s',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          if (!isActive) (e.currentTarget as HTMLElement).style.opacity = '0.75';
        }}
      >
        {failed
          ? (
            errorFallback || (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(148,163,184,0.15)',
                  color: '#94a3b8',
                  fontSize: Math.max(10, size * 0.18),
                }}
              >
                🖼
              </div>
            )
          )
          : (
            <>
              {placeholder && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(148,163,184,0.1)',
                  }}
                >
                  {placeholder}
                </div>
              )}
              <img
                src={src}
                alt={item.alt || ''}
                loading="lazy"
                onError={() => setFailed(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </>
          )}
      </div>
    );
  };

  const renderThumbnails = () => {
    if (mode === 'grid') {
      return (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gap: thumbGap,
          }}
        >
          {images.map((item, idx) => (
            <div key={idx} style={{ aspectRatio: '1' }}>
              <ThumbImage item={item} index={idx} size={thumbSize} />
            </div>
          ))}
        </div>
      );
    }

    if (mode === 'single') {
      if (images.length === 0) return null;
      return <ThumbImage item={images[0]!} index={0} size={thumbSize} />;
    }

    // strip mode (default)
    return (
      <div
        style={{
          display: 'flex',
          gap: thumbGap,
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        {images.map((item, idx) => (
          <ThumbImage key={idx} item={item} index={idx} size={thumbSize} />
        ))}
      </div>
    );
  };

  return (
    <div className={className} style={style}>
      {/* Thumbnail area */}
      {showThumbnails && renderThumbnails()}

      {/* Lightbox */}
      {isOpen && (
        <div
          style={BACKDROP_STYLE}
          onClick={(e) => {
            if (closeOnBackdrop && e.target === e.currentTarget) closeLightbox();
          }}
        >
          {/* Close button */}
          <button
            style={CLOSE_BUTTON_STYLE}
            onClick={closeLightbox}
            aria-label="Close preview"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.25)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)';
            }}
          >
            <CloseIcon />
          </button>

          {/* Counter */}
          {showCounter && images.length > 1 && (
            <div style={COUNTER_STYLE}>
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Previous button */}
          {showArrows && images.length > 1 && (
            <button
              style={{ ...NAV_BUTTON_BASE, left: 20 }}
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              aria-label="Previous image"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.3)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)';
              }}
            >
              <ChevronLeft />
            </button>
          )}

          {/* Image */}
          <div
            style={{
              maxWidth: previewWidth,
              maxHeight: previewMaxHeight,
              width: '90vw',
              height: '80vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={currentImage.src}
              alt={currentImage.alt || ''}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: fit,
                borderRadius,
              }}
              draggable={false}
            />
          </div>

          {/* Next button */}
          {showArrows && images.length > 1 && (
            <button
              style={{ ...NAV_BUTTON_BASE, right: 20 }}
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              aria-label="Next image"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.3)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)';
              }}
            >
              <ChevronRight />
            </button>
          )}

          {/* Caption */}
          {currentImage.caption && (
            <div
              style={{
                position: 'absolute',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#fff',
                fontSize: 14,
                background: 'rgba(0,0,0,0.5)',
                padding: '4px 12px',
                borderRadius: 8,
                maxWidth: '80%',
                textAlign: 'center',
              }}
            >
              {currentImage.caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
