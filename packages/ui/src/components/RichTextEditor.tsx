'use client';

import React, { useState, useId, useCallback, useRef, useEffect } from 'react';

export type RichTextEditorSize = 'sm' | 'md' | 'lg';

export interface ToolbarAction {
  key: string;
  label: string;
  icon?: string;
  command: (editor: RichTextEditorHandle) => void;
}

export interface RichTextEditorHandle {
  getContent: () => string;
  setContent: (html: string) => void;
  exec: (command: string, value?: string) => void;
  focus: () => void;
}

export interface RichTextEditorProps {
  /** Current HTML value */
  value?: string;
  /** Called when content changes (debounced) */
  onChange?: (html: string) => void;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Visual size — affects toolbar and editor font */
  size?: RichTextEditorSize;
  /** Label text rendered above the editor */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper / hint text */
  helperText?: string;
  /** Whether the editor is in a loading state */
  loading?: boolean;
  /** Disable editing */
  disabled?: boolean;
  /** Make the editor fill its container width */
  block?: boolean;
  /** Minimum height in px */
  minHeight?: number;
  /** Maximum height in px (scroll beyond) */
  maxHeight?: number;
  /** Show character count */
  showCount?: boolean;
  /** Toolbar configuration — which buttons to show */
  toolbar?: ToolbarPreset | ToolbarAction[];
  /** Max length for character count */
  maxLength?: number;
  /** Callback when editor ref handle is ready */
  editorRef?: React.Ref<RichTextEditorHandle>;
  /** Test id */
  'data-testid'?: string;
}

export type ToolbarPreset = 'full' | 'basic' | 'minimal';

const TOOLBAR_PRESETS: Record<ToolbarPreset, ToolbarAction[]> = {
  full: [
    { key: 'bold', label: 'Bold', icon: 'B', command: (e) => e.exec('bold') },
    { key: 'italic', label: 'Italic', icon: 'I', command: (e) => e.exec('italic') },
    { key: 'underline', label: 'Underline', icon: 'U', command: (e) => e.exec('underline') },
    { key: 'strikeThrough', label: 'Strikethrough', icon: 'S', command: (e) => e.exec('strikeThrough') },
    { key: '|', label: '|', icon: '|', command: () => {} },
    { key: 'heading', label: 'Heading', icon: 'H', command: (e) => e.exec('formatBlock', 'h3') },
    { key: 'bulletList', label: 'Bullet List', icon: '•', command: (e) => e.exec('insertUnorderedList') },
    { key: 'orderedList', label: 'Ordered List', icon: '1.', command: (e) => e.exec('insertOrderedList') },
    { key: '|2', label: '|', icon: '|', command: () => {} },
    { key: 'link', label: 'Insert Link', icon: '🔗', command: (e) => {
      const url = window.prompt('Enter URL:');
      if (url) e.exec('createLink', url);
    }},
    { key: 'image', label: 'Insert Image', icon: '🖼', command: (e) => {
      const url = window.prompt('Enter image URL:');
      if (url) e.exec('insertImage', url);
    }},
    { key: '|3', label: '|', icon: '|', command: () => {} },
    { key: 'undo', label: 'Undo', icon: '↩', command: (e) => e.exec('undo') },
    { key: 'redo', label: 'Redo', icon: '↪', command: (e) => e.exec('redo') },
  ],
  basic: [
    { key: 'bold', label: 'Bold', icon: 'B', command: (e) => e.exec('bold') },
    { key: 'italic', label: 'Italic', icon: 'I', command: (e) => e.exec('italic') },
    { key: 'underline', label: 'Underline', icon: 'U', command: (e) => e.exec('underline') },
    { key: '|', label: '|', icon: '|', command: () => {} },
    { key: 'bulletList', label: 'Bullet List', icon: '•', command: (e) => e.exec('insertUnorderedList') },
    { key: 'orderedList', label: 'Ordered List', icon: '1.', command: (e) => e.exec('insertOrderedList') },
    { key: '|2', label: '|', icon: '|', command: () => {} },
    { key: 'link', label: 'Link', icon: '🔗', command: (e) => {
      const url = window.prompt('Enter URL:');
      if (url) e.exec('createLink', url);
    }},
  ],
  minimal: [
    { key: 'bold', label: 'Bold', icon: 'B', command: (e) => e.exec('bold') },
    { key: 'italic', label: 'Italic', icon: 'I', command: (e) => e.exec('italic') },
    { key: 'underline', label: 'Underline', icon: 'U', command: (e) => e.exec('underline') },
  ],
};

const SIZE_STYLES: Record<RichTextEditorSize, Record<string, string | number>> = {
  sm: { fontSize: 13, padding: '6px 8px', minHeight: 80 },
  md: { fontSize: 14, padding: '8px 10px', minHeight: 120 },
  lg: { fontSize: 16, padding: '10px 12px', minHeight: 160 },
};

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '');
}

export const RichTextEditor = React.forwardRef<RichTextEditorHandle, RichTextEditorProps>(function RichTextEditor(
  {
    value = '',
    onChange,
    placeholder = 'Type something...',
    size = 'md',
    label,
    error,
    helperText,
    loading = false,
    disabled = false,
    block = false,
    minHeight,
    maxHeight,
    showCount = false,
    toolbar = 'basic',
    maxLength,
    editorRef,
    'data-testid': dataTestId,
  }: RichTextEditorProps,
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorContentRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const uniqueId = useId();
  const contentId = `rte-content-${uniqueId}`;

  // Exposed handle
  const handle = useRef<RichTextEditorHandle>({
    getContent: () => editorContentRef.current?.innerHTML ?? '',
    setContent: (html: string) => {
      if (editorContentRef.current) {
        editorContentRef.current.innerHTML = sanitizeHtml(html);
        setCurrentValue(html);
      }
    },
    exec: (command: string, value?: string) => {
      document.execCommand(command, false, value);
      if (editorContentRef.current) {
        const html = editorContentRef.current.innerHTML;
        setCurrentValue(html);
        onChange?.(html);
      }
    },
    focus: () => editorContentRef.current?.focus(),
  });

  React.useImperativeHandle(ref, () => handle.current);
  React.useImperativeHandle(editorRef, () => handle.current);

  // Sync initial value
  useEffect(() => {
    if (editorContentRef.current && !editorContentRef.current.innerHTML) {
      editorContentRef.current.innerHTML = sanitizeHtml(value);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external value changes
  useEffect(() => {
    if (editorContentRef.current && value !== currentValue) {
      editorContentRef.current.innerHTML = sanitizeHtml(value);
      setCurrentValue(value);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInput = useCallback(() => {
    if (!editorContentRef.current) return;
    const html = editorContentRef.current.innerHTML;
    if (maxLength && html.replace(/<[^>]*>/g, '').length > maxLength) return;
    setCurrentValue(html);
    onChange?.(html);
  }, [onChange, maxLength]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  const toolbarActions = Array.isArray(toolbar) ? toolbar : TOOLBAR_PRESETS[toolbar] ?? TOOLBAR_PRESETS.basic;

  const textLength = currentValue.replace(/<[^>]*>/g, '').length;

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    flexDirection: 'column',
    width: block ? '100%' : undefined,
    opacity: disabled ? 0.6 : loading ? 0.7 : 1,
    pointerEvents: disabled ? 'none' : undefined,
  };

  const editorStyle: React.CSSProperties = {
    border: `1px solid ${error ? '#ef4444' : isFocused ? '#3b82f6' : '#374151'}`,
    borderRadius: 6,
    background: loading ? '#f9fafb' : '#1e1e2e',
    overflow: 'hidden',
    boxShadow: isFocused && !error ? '0 0 0 3px rgba(59,130,246,0.12)' : undefined,
  };

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 2,
    padding: '4px 6px',
    borderBottom: '1px solid #374151',
    background: '#16162a',
  };

  const tbBtnStyle = (action: ToolbarAction): React.CSSProperties => {
    if (action.icon === '|') {
      return {
        width: 1,
        height: 20,
        background: '#374151',
        margin: '0 4px',
        border: 'none',
        padding: 0,
      };
    }
    return {
      background: 'transparent',
      border: 'none',
      color: '#cbd5e1',
      cursor: 'pointer',
      fontSize: size === 'sm' ? 12 : size === 'lg' ? 15 : 13,
      fontWeight: 600,
      width: 28,
      height: 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 4,
      transition: 'background 0.15s',
      fontFamily: 'inherit',
    };
  };

  return (
    <div style={containerStyle} data-testid={dataTestId}>
      {label && (
        <label
          htmlFor={contentId}
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 500,
            color: disabled ? '#64748b' : '#cbd5e1',
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      )}

      <div
        ref={containerRef}
        style={editorStyle}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        {/* Toolbar */}
        <div style={toolbarStyle} role="toolbar" aria-label="Rich text editor toolbar">
          {toolbarActions.map((action) => {
            if (action.icon === '|') {
              return <div key={action.key} style={tbBtnStyle(action)} />;
            }
            return (
              <button
                key={action.key}
                type="button"
                title={action.label}
                style={tbBtnStyle(action)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#374151';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handle.current.exec(action.key === 'heading' ? 'formatBlock' : action.key === 'link' || action.key === 'image' ? '' : '', '');
                  action.command(handle.current);
                }}
              >
                {action.icon && action.icon.length <= 2 ? action.icon : action.label.charAt(0)}
              </button>
            );
          })}
        </div>

        {/* Editable content area */}
        <div
          id={contentId}
          ref={editorContentRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={label ?? 'Rich text editor'}
          data-placeholder={placeholder}
          onInput={handleInput}
          onPaste={handlePaste}
          style={{
            ...SIZE_STYLES[size],
            outline: 'none',
            color: '#e2e8f0',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowY: 'auto',
            minHeight: minHeight ?? SIZE_STYLES[size].minHeight,
            maxHeight,
            cursor: disabled ? 'default' : 'text',
          }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentValue) }}
        />
      </div>

      {/* Footer: helper / error / char count */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 4,
          minHeight: 18,
        }}
      >
        <div>
          {helperText && !error && (
            <span style={{ fontSize: 12, color: '#64748b' }}>{helperText}</span>
          )}
          {error && (
            <span style={{ fontSize: 12, color: '#fca5a5' }}>{error}</span>
          )}
        </div>
        {showCount && (
          <span style={{ fontSize: 12, color: '#64748b' }}>
            {textLength}{maxLength ? ` / ${maxLength}` : ''}
          </span>
        )}
      </div>
    </div>
  );
});
