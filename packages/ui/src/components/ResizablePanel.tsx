import React, { useCallback, useEffect, useRef, useState } from 'react';

export type ResizablePanelDirection = 'horizontal' | 'vertical';

export interface ResizablePanelProps {
  /** Initial ratio of left/top panel (0-1). Default 0.5 */
  defaultRatio?: number;
  /** Direction of resizing */
  direction?: ResizablePanelDirection;
  /** Minimum ratio for left/top panel */
  minRatio?: number;
  /** Maximum ratio for left/top panel */
  maxRatio?: number;
  /** Left/top panel content */
  left: React.ReactNode;
  /** Right/bottom panel content */
  right: React.ReactNode;
  /** Additional class name */
  className?: string;
  /** Handle width/height in px */
  handleSize?: number;
  /** Callback on ratio change */
  onRatioChange?: (ratio: number) => void;
  /** Aria label for the resize handle */
  handleLabel?: string;
}

/**
 * A draggable split-panel container that lets users resize two adjacent panels.
 */
export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  defaultRatio = 0.5,
  direction = 'horizontal',
  minRatio = 0.15,
  maxRatio = 0.85,
  left,
  right,
  className = '',
  handleSize = 4,
  onRatioChange,
  handleLabel = '拖拽调整面板大小',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Define clampFn outside of hooks so it's available for both initial state and callbacks
  const clampFn = useCallback((v: number) => Math.min(maxRatio, Math.max(minRatio, v)), [minRatio, maxRatio]);

  const [ratio, setRatio] = useState(clampFn(defaultRatio));
  const dragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [direction]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = direction === 'horizontal' ? clientX - rect.left : clientY - rect.top;
    const size = direction === 'horizontal' ? rect.width : rect.height;
    const newRatio = clampFn(pos / size);
    setRatio(newRatio);
    onRatioChange?.(newRatio);
  }, [direction, clampFn, onRatioChange]);

  const clampKeyboard = useCallback((v: number) => Math.min(maxRatio, Math.max(minRatio, v)), [minRatio, maxRatio]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches.item(0);
    if (touch) {
      handleMove(touch.clientX, touch.clientY);
    }
  }, [handleMove]);

  const handleUp = useCallback(() => {
    if (dragging.current) {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [handleMouseMove, handleUp, handleTouchMove]);

  const isHorizontal = direction === 'horizontal';

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          [isHorizontal ? 'width' : 'height']: `calc(${ratio * 100}% - ${handleSize / 2}px)`,
          overflow: 'auto',
          flexShrink: 0,
        }}
      >
        {left}
      </div>
      <div
        role="separator"
        tabIndex={0}
        aria-label={handleLabel}
        aria-orientation={direction}
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={Math.round(minRatio * 100)}
        aria-valuemax={Math.round(maxRatio * 100)}
        onMouseDown={handleMouseDown}
        onTouchStart={(e) => {
          e.preventDefault();
          dragging.current = true;
        }}
        onKeyDown={(e) => {
          const step = 0.02;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            setRatio((r) => clampKeyboard(r + step));
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            setRatio((r) => clampKeyboard(r - step));
          }
        }}
        style={{
          [isHorizontal ? 'width' : 'height']: handleSize,
          cursor: isHorizontal ? 'col-resize' : 'row-resize',
          backgroundColor: 'transparent',
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            position: 'absolute',
            [isHorizontal ? 'width' : 'height']: 1,
            [isHorizontal ? 'height' : 'width']: '100%',
            backgroundColor: '#d0d5dd',
            [isHorizontal ? 'top' : 'left']: 0,
            [isHorizontal ? 'left' : 'top']: '50%',
            transform: isHorizontal ? 'translateY(-50%)' : 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        />
      </div>
      <div
        style={{
          [isHorizontal ? 'width' : 'height']: `calc(${(1 - ratio) * 100}% - ${handleSize / 2}px)`,
          overflow: 'auto',
          flex: 1,
        }}
      >
        {right}
      </div>
    </div>
  );
};

export default ResizablePanel;
