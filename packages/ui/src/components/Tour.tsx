'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

// ---- Types ----

export interface TourStep {
  /** 目标元素 CSS 选择器（用于定位高亮区域） */
  targetSelector: string;
  /** step 标题 */
  title: string;
  /** step 描述正文 */
  description: string;
  /** 弹窗位置（相对于目标元素），默认 bottom */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** 是否在弹窗底部显示「跳过」按钮 */
  showSkip?: boolean;
  /** 自定义下一步按钮文字 */
  nextText?: string;
  /** 自定义上一步按钮文字 */
  prevText?: string;
  /** 自定义完成按钮文字 */
  doneText?: string;
}

export interface TourProps {
  /** 是否显示引导 */
  open: boolean;
  /** 引导步骤列表 */
  steps: TourStep[];
  /** 关闭/完成回调 */
  onClose: () => void;
  /** 每一步切换后的回调 */
  onStepChange?: (current: number) => void;
  /** 初始步骤索引（默认 0） */
  initialStep?: number;
  /** 遮罩层背景色 */
  maskColor?: string;
  /** 弹窗自定义类名 */
  className?: string;
  /** 弹窗自定义样式 */
  style?: React.CSSProperties;
  /** 是否显示进度指示（第N步/共M步） */
  showProgress?: boolean;
  /** 是否显示底部的上一步/下一步/完成按钮 */
  showActions?: boolean;
  /** 是否允许点击遮罩关闭 */
  maskClosable?: boolean;
}

// ---- Helper: scroll to element ----
function scrollIntoViewIfNeeded(selector: string): Element | null {
  const el = document.querySelector(selector);
  if (el) {
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  return el;
}

/**
 * Tour — 新手引导/产品漫游组件。
 *
 * 按步骤高亮目标元素并展示说明弹窗，支持上一步/下一步/跳过/完成。
 * 使用 Portal 渲染到 document.body。
 */
export const Tour: React.FC<TourProps> = ({
  open,
  steps,
  onClose,
  onStepChange,
  initialStep = 0,
  maskColor = 'rgba(0,0,0,0.5)',
  className = '',
  style,
  showProgress = true,
  showActions = true,
  maskClosable = false,
}) => {
  const [current, setCurrent] = useState(initialStep);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>(
    // SSR safe default: center the tooltip
    { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10001 },
  );
  const [isHydrated, setIsHydrated] = useState(false);

  // 重置到 initialStep 当 open 变化
  useEffect(() => {
    if (open) {
      setCurrent(initialStep);
    }
    setIsHydrated(true);
  }, [open, initialStep]);

  // 定位目标元素
  const locateTarget = useCallback(
    (index: number) => {
      const step = steps[index];
      if (!step) return;

      const el = scrollIntoViewIfNeeded(step.targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        // 延迟等 scroll 结束后再定位 tooltip
        setTimeout(() => {
          if (tooltipRef.current) {
            const tipRect = tooltipRef.current.getBoundingClientRect();
            const placement = step.placement ?? 'bottom';
            const gap = 12;
            const tipW = tipRect.width;
            const tipH = tipRect.height;

            let top = 0;
            let left = 0;

            switch (placement) {
              case 'top':
                top = rect.top - tipH - gap;
                left = rect.left + rect.width / 2 - tipW / 2;
                break;
              case 'bottom':
                top = rect.bottom + gap;
                left = rect.left + rect.width / 2 - tipW / 2;
                break;
              case 'left':
                top = rect.top + rect.height / 2 - tipH / 2;
                left = rect.left - tipW - gap;
                break;
              case 'right':
                top = rect.top + rect.height / 2 - tipH / 2;
                left = rect.right + gap;
                break;
              case 'center':
                top = window.innerHeight / 2 - tipH / 2;
                left = window.innerWidth / 2 - tipW / 2;
                break;
            }

            // 边界修正
            top = Math.max(8, Math.min(top, window.innerHeight - tipH - 8));
            left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8));

            setTooltipStyle({
              position: 'fixed',
              top,
              left,
              zIndex: 10001,
            });
          }
        }, 50);
      } else {
        setTargetRect(null);
        // 无目标则居中
        setTooltipStyle({
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10001,
        });
      }
    },
    [steps],
  );

  // 切换步骤时重新定位
  useEffect(() => {
    if (open) {
      setIsHydrated(true);
      locateTarget(current);
    }
  }, [open, current, locateTarget]);

  // 窗口 resize 时重新定位
  useEffect(() => {
    if (!open) return;
    const handleResize = () => locateTarget(current);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [open, current, locateTarget]);

  const handleNext = useCallback(() => {
    const next = current + 1;
    if (next >= steps.length) {
      onClose();
    } else {
      setCurrent(next);
      onStepChange?.(next);
    }
  }, [current, steps.length, onClose, onStepChange]);

  const handlePrev = useCallback(() => {
    if (current > 0) {
      const prev = current - 1;
      setCurrent(prev);
      onStepChange?.(prev);
    }
  }, [current, onStepChange]);

  const handleSkip = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!open || steps.length === 0) return null;

  const step = steps[current];
  if (!step) return null;
  const isFirst = current === 0;
  const isLast = current === steps.length - 1;

  return (
    <>
      {/* 遮罩层 */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: maskColor,
          zIndex: 9999,
          cursor: maskClosable ? 'pointer' : undefined,
        }}
        onClick={maskClosable ? handleSkip : undefined}
      />

      {/* 目标高亮「镂空」效果 — 使用 outline 实现 */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            borderRadius: 4,
            boxShadow: '0 0 0 9999px ' + maskColor,
            zIndex: 10000,
            pointerEvents: 'none',
            transition: 'all 0.3s ease',
          }}
        />
      )}

      {/* 弹窗 */}
      <div
        ref={tooltipRef}
        className={className}
        style={{
          ...tooltipStyle,
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
          padding: 20,
          maxWidth: 360,
          minWidth: 220,
          ...style,
        }}
      >
        {/* 进度指示 */}
        {showProgress && (
          <div
            style={{
              fontSize: 12,
              color: '#999',
              marginBottom: 8,
            }}
          >
            {current + 1} / {steps.length}
          </div>
        )}

        {/* 标题 */}
        <h4
          style={{
            margin: '0 0 8px',
            fontSize: 16,
            fontWeight: 600,
            color: '#333',
          }}
        >
          {step.title}
        </h4>

        {/* 描述 */}
        <p
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.6,
            color: '#666',
          }}
        >
          {step.description}
        </p>

        {/* 操作按钮 */}
        {showActions && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 16,
            }}
          >
            <div>
              {!isFirst && (
                <button
                  onClick={handlePrev}
                  style={{
                    padding: '6px 14px',
                    fontSize: 13,
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                    background: '#fff',
                    cursor: 'pointer',
                    color: '#333',
                  }}
                >
                  {step.prevText ?? '上一步'}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!isLast && step.showSkip !== false && (
                <button
                  onClick={handleSkip}
                  style={{
                    padding: '6px 14px',
                    fontSize: 13,
                    border: 'none',
                    borderRadius: 4,
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#999',
                  }}
                >
                  跳过
                </button>
              )}
              <button
                onClick={handleNext}
                style={{
                  padding: '6px 20px',
                  fontSize: 13,
                  border: 'none',
                  borderRadius: 4,
                  background: '#1677ff',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {isLast
                  ? step.doneText ?? '完成'
                  : step.nextText ?? '下一步'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Tour;
