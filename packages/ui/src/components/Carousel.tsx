'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

export interface CarouselSlide {
  key: string;
  content: React.ReactNode;
  /** Optional aria label for the slide */
  label?: string;
}

export interface CarouselProps {
  slides: CarouselSlide[];
  /** Auto-play interval in ms. 0 disables auto-play. */
  autoPlay?: number;
  /** Show navigation arrows */
  showArrows?: boolean;
  /** Show dot indicators */
  showDots?: boolean;
  /** Infinite loop */
  loop?: boolean;
  /** Number of slides visible at once */
  slidesPerView?: number;
  /** Gap between slides in px */
  gap?: number;
  /** Aspect ratio, e.g. '16/9', '4/3', '1/1' */
  aspectRatio?: string;
  /** Visual variant */
  variant?: 'default' | 'fade' | 'card';
  /** Height in px (overrides aspectRatio) */
  height?: number;
  /** Aria label for the carousel */
  ariaLabel?: string;
}

function resolveAspectRatioPadding(ratio: string): string {
  const parts = ratio.split('/');
  if (parts.length !== 2) return '56.25%'; // default 16:9
  const w = Number(parts[0]);
  const h = Number(parts[1]);
  if (!w || !h) return '56.25%';
  return `${(h / w) * 100}%`;
}

export function Carousel({
  slides,
  autoPlay = 0,
  showArrows = true,
  showDots = true,
  loop = true,
  slidesPerView = 1,
  gap = 0,
  aspectRatio = '16/9',
  variant = 'default',
  height,
  ariaLabel = 'Carousel',
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSlides = slides.length;
  if (totalSlides === 0) return null;

  const maxIndex = Math.max(0, Math.ceil(totalSlides / slidesPerView) - 1);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      let target = index;
      if (loop) {
        if (target < 0) target = maxIndex;
        if (target > maxIndex) target = 0;
      } else {
        target = Math.max(0, Math.min(target, maxIndex));
      }
      if (target === currentIndex) return;
      setIsTransitioning(true);
      setCurrentIndex(target);
    },
    [currentIndex, maxIndex, loop, isTransitioning],
  );

  const goNext = useCallback(() => {
    goTo(currentIndex + 1);
  }, [currentIndex, goTo]);

  const goPrev = useCallback(() => {
    goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  // Auto-play
  useEffect(() => {
    if (autoPlay > 0 && totalSlides > 1) {
      autoPlayRef.current = setInterval(() => {
        goNext();
      }, autoPlay);
    }
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };
  }, [autoPlay, goNext, totalSlides]);

  // Reset transition flag after animation
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  const aspectPadding = resolveAspectRatioPadding(aspectRatio);

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
    width: '100%',
    height: height !== undefined ? height : undefined,
  };

  if (height === undefined) {
    wrapperStyle.position = 'relative';
    wrapperStyle.paddingTop = aspectPadding;
  }

  const trackStyle: React.CSSProperties = {
    display: 'flex',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: `translateX(-${currentIndex * 100}%)`,
  };

  const slideOuterStyle: React.CSSProperties = {
    flex: `0 0 ${100 / slidesPerView}%`,
    paddingRight: gap,
    boxSizing: 'border-box',
  };

  const slideInnerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: variant === 'card' ? 8 : 0,
    background:
      variant === 'card'
        ? 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(99,102,241,0.04) 100%)'
        : 'transparent',
    ...(variant === 'card'
      ? {
          border: '1px solid rgba(148,163,184,0.12)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }
      : {}),
    ...(variant === 'fade'
      ? {
          transition: 'opacity 0.35s ease',
        }
      : {}),
  };

  // Arrow button styles
  const arrowBtnBase: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(15,23,42,0.75)',
    color: '#e2e8f0',
    backdropFilter: 'blur(8px)',
    transition: 'background 0.2s ease, opacity 0.2s ease',
    padding: 0,
  };

  // Dot styles
  const dotsWrapperStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 8,
    zIndex: 10,
  };

  const dotBase: React.CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    transition: 'background 0.2s ease, transform 0.2s ease',
  };

  // Determine active dots
  const activeDotIndex = Math.floor(currentIndex);
  const dotsCount = maxIndex + 1;

  return (
    <div
      ref={containerRef}
      style={wrapperStyle}
      role="region"
      aria-label={ariaLabel}
      aria-roledescription="carousel"
      data-testid="carousel"
    >
      {/* Track */}
      <div style={trackStyle} data-testid="carousel-track">
        {slides.map((slide, idx) => (
          <div
            key={slide.key}
            style={slideOuterStyle}
            role="group"
            aria-roledescription="slide"
            aria-label={slide.label || `Slide ${idx + 1} of ${totalSlides}`}
            data-testid={`carousel-slide-${slide.key}`}
          >
            <div style={slideInnerStyle}>{slide.content}</div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      {showArrows && totalSlides > slidesPerView && (
        <>
          <button
            type="button"
            style={{ ...arrowBtnBase, left: 12 }}
            onClick={goPrev}
            aria-label="Previous slide"
            data-testid="carousel-prev"
          >
            <svg width={18} height={18} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M10 4L6 8l4 4" />
            </svg>
          </button>
          <button
            type="button"
            style={{ ...arrowBtnBase, right: 12 }}
            onClick={goNext}
            aria-label="Next slide"
            data-testid="carousel-next"
          >
            <svg width={18} height={18} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M6 4l4 4-4 4" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && dotsCount > 1 && (
        <div style={dotsWrapperStyle} data-testid="carousel-dots">
          {Array.from({ length: dotsCount }, (_, i) => (
            <button
              key={i}
              type="button"
              style={{
                ...dotBase,
                background: i === activeDotIndex ? '#e2e8f0' : 'rgba(148,163,184,0.4)',
                transform: i === activeDotIndex ? 'scale(1.3)' : 'scale(1)',
              }}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === activeDotIndex ? 'true' : undefined}
              data-testid={`carousel-dot-${i}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
