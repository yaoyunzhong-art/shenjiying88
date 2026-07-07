'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

export type CollapseSize = 'sm' | 'md';
export type CollapseVariant = 'default' | 'bordered' | 'minimal';

export interface CollapseProps {
  /** Title text or custom title node. */
  title: React.ReactNode;
  /** Collapsible content. */
  children: React.ReactNode;
  /** Uncontrolled: initially open. */
  defaultOpen?: boolean;
  /** Controlled: external open state. */
  open?: boolean;
  /** Controlled callback. */
  onOpenChange?: (open: boolean) => void;
  /** Size preset. @default 'md' */
  size?: CollapseSize;
  /** Visual variant. @default 'default' */
  variant?: CollapseVariant;
  /** Additional CSS class. */
  className?: string;
  /** Disable toggle. */
  disabled?: boolean;
  /** Subtitle shown next to the chevron area. */
  subtitle?: React.ReactNode;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const SIZE_CLASS: Record<CollapseSize, string> = {
  sm: 'py-1 px-2 text-xs',
  md: 'py-2 px-3 text-sm',
};

const VARIANT_CLASS: Record<CollapseVariant, string> = {
  default: 'border border-gray-200 rounded-md',
  bordered: 'border-2 border-gray-300 rounded-lg',
  minimal: 'border-b border-gray-100',
};

// ── Component ───────────────────────────────────────────────────────────────

export function Collapse({
  title,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  size = 'md',
  variant = 'default',
  className = '',
  disabled = false,
  subtitle,
}: CollapseProps) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = isControlled ? controlledOpen : internalOpen;
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    const next = !open;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }, [open, disabled, isControlled, onOpenChange]);

  return (
    <div className={`${VARIANT_CLASS[variant]} ${className}`}>
      {/* Header */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-expanded={open}
        className={`
          flex w-full items-center justify-between gap-2
          ${SIZE_CLASS[size]}
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          hover:bg-gray-50 transition-colors text-left
        `}
      >
        <span className="font-medium text-gray-900 truncate">{title}</span>
        <span className="flex items-center gap-2 shrink-0">
          {subtitle && (
            <span className="text-gray-400 text-xs">{subtitle}</span>
          )}
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Content */}
      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: open ? contentHeight : 0 }}
      >
        <div ref={contentRef} className={SIZE_CLASS[size] + ' pt-0'}>
          {children}
        </div>
      </div>
    </div>
  );
}
