'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';

// ============ Types ============

export interface MentionOption {
  /** 唯一标识 */
  id: string;
  /** 显示名称 */
  label: string;
  /** 匹配关键词（默认同 label） */
  keyword?: string;
  /** 头像/图标 */
  avatar?: React.ReactNode;
  /** 副标题 */
  subtitle?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

export interface MentionItem {
  /** 提及的选项 id */
  id: string;
  /** 显示的文本（含 @前缀） */
  display: string;
  /** 原始触发位置 */
  trigger: string;
}

export interface MentionsProps {
  /** 可选提及列表 */
  options: MentionOption[];
  /** 当前文本值（受控） */
  value?: string;
  /** 默认文本值（非受控） */
  defaultValue?: string;
  /** 文本变化回调 */
  onChange?: (text: string, mentions: MentionItem[]) => void;
  /** 提及变化回调 */
  onMentionsChange?: (mentions: MentionItem[]) => void;
  /** 触发字符，默认 '@' */
  trigger?: string;
  /** 占位文字 */
  placeholder?: string;
  /** 最大高度 */
  maxHeight?: number | string;
  /** 最小行数 */
  minRows?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义 data-testid */
  'data-testid'?: string;
}

// ============ Component ============

export function Mentions({
  options,
  value: controlledValue,
  defaultValue = '',
  onChange,
  onMentionsChange,
  trigger = '@',
  placeholder = '请输入，输入 @ 提及用户',
  maxHeight = 200,
  minRows = 2,
  disabled = false,
  className = '',
  'data-testid': dataTestId = 'mentions',
}: MentionsProps) {
  // ---- State ----
  const [internalText, setInternalText] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [triggerIndex, setTriggerIndex] = useState(-1);
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isControlled = controlledValue !== undefined;

  const currentText = isControlled ? controlledValue : internalText;

  // ---- 从文本提取 mentions ----
  const extractMentions = useCallback(
    (text: string): MentionItem[] => {
      const regex = new RegExp(`${trigger}(\\w+[\\w\\u4e00-\\u9fff]*)`, 'g');
      const items: MentionItem[] = [];
      const seen = new Set<string>();
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        const word = match[1];
        const found = options.find(
          (o) => o.label === word || o.keyword === word || o.id === word,
        );
        if (found && !seen.has(found.id)) {
          seen.add(found.id);
          items.push({
            id: found.id,
            display: `${trigger}${found.label}`,
            trigger,
          });
        }
      }
      return items;
    },
    [options, trigger],
  );

  // ---- 根据当前光标位置查找 trigger ----
  const findTrigger = useCallback(
    (text: string, cursorPos: number): { index: number; query: string } | null => {
      const beforeCursor = text.slice(0, cursorPos);
      const triggerIdx = beforeCursor.lastIndexOf(trigger);
      if (triggerIdx === -1) return null;

      // trigger 之后不允许有空格（否则不是连续的提及输入）
      const afterTrigger = beforeCursor.slice(triggerIdx + trigger.length);
      if (afterTrigger.includes(' ')) return null;

      // 确保 trigger 前面是空格或开头
      if (triggerIdx > 0 && text[triggerIdx - 1] !== ' ' && text[triggerIdx - 1] !== '\n') {
        return null;
      }

      return { index: triggerIdx, query: afterTrigger };
    },
    [trigger],
  );

  // ---- 过滤选项 ----
  const filteredOptions = useMemo(() => {
    if (!query) return options.slice(0, 10);
    const q = query.toLowerCase();
    return options
      .filter(
        (o) =>
          o.label.toLowerCase().includes(q) ||
          (o.keyword ?? '').toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [options, query]);

  // ---- 选中提及 ----
  const selectMention = useCallback(
    (option: MentionOption) => {
      const beforeTrigger = currentText.slice(0, triggerIndex);
      const afterCursor = currentText.slice(
        triggerIndex + trigger.length + query.length,
      );
      const mentionText = `${trigger}${option.label} `;
      const newText = beforeTrigger + mentionText + afterCursor;

      if (!isControlled) setInternalText(newText);
      const mentions = extractMentions(newText);
      onChange?.(newText, mentions);
      onMentionsChange?.(mentions);
      setIsOpen(false);
      setHighlightIndex(-1);
      setTriggerIndex(-1);
      setQuery('');

      // 让 textarea 保持焦点
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const pos = beforeTrigger.length + mentionText.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(pos, pos);
        }
      });
    },
    [currentText, triggerIndex, query, trigger, isControlled, onChange, onMentionsChange, extractMentions],
  );

  // ---- 输入变化 ----
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      if (!isControlled) setInternalText(newText);

      // 检测 trigger
      const cursorPos = e.target.selectionStart ?? newText.length;
      const found = findTrigger(newText, cursorPos);
      if (found) {
        setTriggerIndex(found.index);
        setQuery(found.query);
        setIsOpen(true);
        setHighlightIndex(0);
      } else {
        // 如果 trigger 被删除，关闭面板
        if (isOpen) {
          setIsOpen(false);
          setHighlightIndex(-1);
          setTriggerIndex(-1);
          setQuery('');
        }
      }

      const mentions = extractMentions(newText);
      onChange?.(newText, mentions);
      onMentionsChange?.(mentions);
    },
    [isControlled, findTrigger, extractMentions, onChange, onMentionsChange, isOpen],
  );

  // ---- 键盘导航 ----
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' && triggerIndex >= 0) {
          setIsOpen(true);
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1,
          );
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (highlightIndex >= 0 && highlightIndex < filteredOptions.length) {
            const opt = filteredOptions[highlightIndex];
            if (opt && !opt.disabled) selectMention(opt);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setHighlightIndex(-1);
          break;
      }
    },
    [isOpen, filteredOptions, highlightIndex, selectMention, triggerIndex],
  );

  // ---- 外部点击关闭 ----
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ---- 自动伸缩高度 ----
  const textareaStyle = useMemo((): React.CSSProperties => {
    const lineHeight = 22;
    const minHeight = minRows * lineHeight + 16; // padding
    return {
      width: '100%',
      minHeight,
      maxHeight,
      resize: 'vertical',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: 6,
      fontSize: 14,
      lineHeight: `${lineHeight}px`,
      fontFamily: 'inherit',
      outline: 'none',
      background: disabled ? '#f3f4f6' : '#fff',
      color: disabled ? '#9ca3af' : '#1f2937',
      cursor: disabled ? 'not-allowed' : 'text',
      boxSizing: 'border-box',
    };
  }, [minRows, maxHeight, disabled]);

  const testId = (suffix: string) => `${dataTestId}-${suffix}`;

  return (
    <div
      ref={containerRef}
      className={`m5-mentions ${className}`}
      style={{ position: 'relative', width: '100%' }}
      data-testid={dataTestId}
    >
      <textarea
        ref={textareaRef}
        value={currentText}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        style={textareaStyle}
        data-testid={testId('textarea')}
      />

      {/* 提及下拉面板 */}
      {isOpen && filteredOptions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            bottom: '100%',
            left: Math.max(0, triggerIndex * 8),
            margin: 0,
            padding: '4px 0',
            listStyle: 'none',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1050,
            minWidth: 200,
            maxHeight: 240,
            overflowY: 'auto',
          }}
          data-testid={testId('dropdown')}
        >
          {filteredOptions.map((option, idx) => (
            <li
              key={option.id}
              role="option"
              aria-selected={highlightIndex === idx}
              onClick={() => !option.disabled && selectMention(option)}
              onMouseEnter={() => setHighlightIndex(idx)}
              style={{
                padding: '6px 12px',
                cursor: option.disabled ? 'not-allowed' : 'pointer',
                background: highlightIndex === idx ? '#eff6ff' : 'transparent',
                color: option.disabled ? '#d1d5db' : '#1f2937',
                fontSize: 13,
                lineHeight: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              data-testid={testId(`option-${idx}`)}
            >
              {option.avatar && (
                <span data-testid={testId(`option-avatar-${idx}`)}>{option.avatar}</span>
              )}
              <div style={{ flex: 1 }}>
                <div data-testid={testId(`option-label-${idx}`)}>{option.label}</div>
                {option.subtitle && (
                  <div
                    style={{ fontSize: 11, color: '#6b7280' }}
                    data-testid={testId(`option-subtitle-${idx}`)}
                  >
                    {option.subtitle}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
