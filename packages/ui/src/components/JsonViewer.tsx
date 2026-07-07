'use client';
import React, { useState, useCallback } from 'react';

// ---- Types ----

export interface JsonViewerProps {
  /** JSON data to display (object, array, or serializable value) */
  data: unknown;
  /** Maximum initial depth of expanded nodes. Defaults to 2. */
  defaultExpandDepth?: number;
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
  /** Custom className */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
}

interface JsonNodeProps {
  label?: string;
  value: unknown;
  depth: number;
  expandDepth: number;
}

// ---- Theme colours ----

const COLORS = {
  key: '#e879f9',
  string: '#a5d6ff',
  number: '#fbbf24',
  boolean: '#34d399',
  null: '#9ca3af',
  bracket: '#e2e8f0',
  punctuation: '#94a3b8',
  indentGuide: 'rgba(148, 163, 184, 0.12)',
  bg: '#0f172a',
  lineNo: '#475569',
};

// ---- Styling helpers ----

const STYLES: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace",
    fontSize: '0.8125rem',
    lineHeight: '1.6',
    background: COLORS.bg,
    borderRadius: '8px',
    padding: '12px 0',
    overflow: 'auto',
    maxHeight: '480px',
  },
  line: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '0 12px',
    whiteSpace: 'nowrap',
  },
  lineNo: {
    display: 'inline-block',
    minWidth: '32px',
    color: COLORS.lineNo,
    userSelect: 'none',
    textAlign: 'right',
    marginRight: '12px',
    fontSize: '0.75rem',
  },
};

// ---- Helper: format primitive values ----

function formatPrimitive(val: unknown): { text: string; color: string } {
  if (val === null) return { text: 'null', color: COLORS.null };
  if (val === undefined) return { text: 'undefined', color: COLORS.null };
  if (typeof val === 'string') return { text: `"${val}"`, color: COLORS.string };
  if (typeof val === 'number') return { text: String(val), color: COLORS.number };
  if (typeof val === 'boolean') return { text: String(val), color: COLORS.boolean };
  return { text: String(val), color: COLORS.string };
}

// ---- Expand / collapse toggle icon ----

const CollapseIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <span
    style={{
      display: 'inline-block',
      width: '14px',
      textAlign: 'center',
      color: COLORS.punctuation,
      cursor: 'pointer',
      userSelect: 'none',
      marginRight: '4px',
      flexShrink: 0,
    }}
  >
    {expanded ? '▾' : '▸'}
  </span>
);

// ---- JsonNode (recursive) ----

const JsonNode: React.FC<JsonNodeProps> = ({ label, value, depth, expandDepth }) => {
  const [expanded, setExpanded] = useState(depth < expandDepth);
  const toggle = useCallback(() => setExpanded((p) => !p), []);

  // ---- Primitives ----
  if (value === null || value === undefined || typeof value !== 'object') {
    const { text, color } = formatPrimitive(value);
    return (
      <span>
        {label !== undefined && (
          <span style={{ color: COLORS.key, marginRight: '6px' }}>
            "{label}"
            <span style={{ color: COLORS.punctuation }}>:</span>
          </span>
        )}
        <span style={{ color }}>{text}</span>
      </span>
    );
  }

  const isArray = Array.isArray(value);
  const isEmpty = isArray ? (value as unknown[]).length === 0 : Object.keys(value as Record<string, unknown>).length === 0;
  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';
  const entries = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
    : Object.entries(value as Record<string, unknown>);

  const bracketColor = COLORS.bracket;
  const lineEls: React.ReactNode[] = [];

  if (isEmpty) {
    lineEls.push(
      <span key="empty">
        {label !== undefined && (
          <span style={{ color: COLORS.key }}>
            "{label}"
            <span style={{ color: COLORS.punctuation }}>:</span>{' '}
          </span>
        )}
        <span style={{ color: bracketColor }}>{openBracket}{closeBracket}</span>
      </span>
    );
  } else {
    lineEls.push(
      <span key="header" style={{ color: bracketColor }}>
        {label !== undefined && (
          <span style={{ color: COLORS.key }}>
            "{label}"
            <span style={{ color: COLORS.punctuation }}>:</span>{' '}
          </span>
        )}
        <span onClick={toggle} style={{ cursor: 'pointer' }}>
          <CollapseIcon expanded={expanded} />
          {openBracket}
        </span>
        <span style={{ color: COLORS.punctuation }}>{`  /* ${isArray ? entries.length : entries.length} */`}</span>
      </span>
    );

    if (expanded) {
      for (const [key, val] of entries) {
        const nodeKey = isArray ? '' : key;
        lineEls.push(
          <div key={key} style={{ paddingLeft: `${16}px`, borderLeft: `1px solid ${COLORS.indentGuide}`, marginLeft: '6px' }}>
            <JsonNode label={isArray ? undefined : key} value={val} depth={depth + 1} expandDepth={expandDepth} />
            <span style={{ color: COLORS.punctuation }}>,</span>
          </div>
        );
      }
    }

    if (expanded) {
      lineEls.push(
        <span key="footer" style={{ color: bracketColor }}>
          {closeBracket}
        </span>
      );
    }
  }

  return <>{lineEls}</>;
};

// ---- JsonViewer ----

export const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  defaultExpandDepth = 2,
  showLineNumbers = true,
  className,
  style,
}) => {
  // Flatten the tree into display lines for line numbers
  const lines = renderTreeToLines(data, defaultExpandDepth);

  return (
    <div
      className={className}
      style={{ ...STYLES.container, ...style }}
      data-testid="json-viewer"
      role="region"
      aria-label="JSON viewer"
    >
      <div style={{ minWidth: 'fit-content' }}>
        <JsonNode value={data} depth={0} expandDepth={defaultExpandDepth} />
      </div>
    </div>
  );
};

// ---- Utility: flatten tree for line count estimate ----

function renderTreeToLines(data: unknown, expandDepth: number): string[] {
  const lines: string[] = [];

  function walk(val: unknown, depth: number): void {
    if (val === null || val === undefined || typeof val !== 'object') {
      const { text } = formatPrimitive(val);
      lines.push(text);
      return;
    }

    const isArray = Array.isArray(val);
    const entries = isArray
      ? (val as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
      : Object.entries(val as Record<string, unknown>);

    if (entries.length === 0) {
      lines.push(isArray ? '[]' : '{}');
      return;
    }

    lines.push(isArray ? '[' : '{');
    if (depth < expandDepth) {
      for (const [, v] of entries) {
        walk(v, depth + 1);
      }
    } else {
      lines.push('/* … collapsed … */');
    }
    lines.push(isArray ? ']' : '}');
  }

  walk(data, 0);
  return lines;
}

export default JsonViewer;
