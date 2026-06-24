'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type KeyboardEvent,
} from 'react';

// ---- Types ----

export interface CommandItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Optional icon element */
  icon?: React.ReactNode;
  /** Keyboard shortcut hint (e.g. "⌘K") */
  shortcut?: string;
  /** Group category */
  group?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Arbitrary payload passed back on select */
  payload?: unknown;
}

export interface CommandPaletteProps {
  /** All available commands */
  commands: CommandItem[];
  /** Whether the palette is open */
  open: boolean;
  /** Called when the palette requests close */
  onClose: () => void;
  /** Called when a command is selected */
  onSelect: (command: CommandItem) => void;
  /** Placeholder text in the search input */
  placeholder?: string;
  /** Empty state message when no commands match */
  emptyMessage?: string;
  /** Maximum visible items before scrolling */
  maxHeight?: number;
  /** Whether to auto-focus the search input on open */
  autoFocus?: boolean;
  /** Custom className for the overlay */
  className?: string;
}

// ---- Helpers ----

interface GroupedCommands {
  group: string;
  items: CommandItem[];
}

function groupCommands(commands: CommandItem[]): GroupedCommands[] {
  const map = new Map<string, CommandItem[]>();
  for (const cmd of commands) {
    const key = cmd.group ?? '';
    const list = map.get(key);
    if (list) {
      list.push(cmd);
    } else {
      map.set(key, [cmd]);
    }
  }
  const result: GroupedCommands[] = [];
  // Ungrouped first
  const ungrouped = map.get('');
  if (ungrouped) {
    result.push({ group: '', items: ungrouped });
    map.delete('');
  }
  for (const [group, items] of map) {
    result.push({ group, items });
  }
  return result;
}

function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < lowerText.length && qi < lowerQuery.length; ti++) {
    if (lowerText[ti] === lowerQuery[qi]) {
      qi++;
    }
  }
  return qi === lowerQuery.length;
}

// ---- Keyboard shortcut rendering ----

function ShortcutBadge({ shortcut }: { shortcut: string }) {
  return (
    <kbd
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '0.7rem',
        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        padding: '1px 5px',
        borderRadius: 4,
        backgroundColor: 'var(--m5-surface-raised, #f3f4f6)',
        border: '1px solid var(--m5-border-subtle, #e5e7eb)',
        color: 'var(--m5-text-tertiary, #6b7280)',
        lineHeight: 1.4,
      }}
    >
      {shortcut}
    </kbd>
  );
}

function HighlightedLabel({ label, query }: { label: string; query: string }) {
  if (!query) return <>{label}</>;

  const lowerLabel = label.toLowerCase();
  const lowerQuery = query.toLowerCase();
  // Build a fuzzy-match highlight: highlight each matching query char in sequence
  const parts: Array<{ text: string; highlight: boolean }> = [];
  let qi = 0;
  let currentNonHighlight = '';

  for (let ti = 0; ti < label.length; ti++) {
    const labelChar = label[ti]!;
    if (qi < lowerQuery.length && lowerLabel[ti] === lowerQuery[qi]) {
      if (currentNonHighlight) {
        parts.push({ text: currentNonHighlight, highlight: false });
        currentNonHighlight = '';
      }
      parts.push({ text: labelChar, highlight: true });
      qi++;
    } else {
      currentNonHighlight += labelChar;
    }
  }
  if (currentNonHighlight) {
    parts.push({ text: currentNonHighlight, highlight: false });
  }

  return (
    <>
      {parts.map((p, i) =>
        p.highlight ? (
          <mark
            key={i}
            style={{
              backgroundColor: 'var(--m5-accent-subtle, #dbeafe)',
              color: 'var(--m5-accent, #2563eb)',
              borderRadius: 2,
            }}
          >
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

// ---- Component ----

export function CommandPalette({
  commands,
  open,
  onClose,
  onSelect,
  placeholder = 'Type a command or search…',
  emptyMessage = 'No matching commands.',
  maxHeight = 400,
  autoFocus = true,
  className,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Filter commands
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    return commands.filter(
      (cmd) =>
        fuzzyMatch(cmd.label, query) ||
        fuzzyMatch(cmd.description ?? '', query) ||
        fuzzyMatch(cmd.group ?? '', query) ||
        fuzzyMatch(cmd.shortcut ?? '', query),
    );
  }, [commands, query]);

  const grouped = useMemo(() => groupCommands(filtered), [filtered]);

  // Flatten grouped items for keyboard navigation
  const flatItems = useMemo(() => {
    const result: CommandItem[] = [];
    for (const g of grouped) {
      result.push(...g.items);
    }
    return result;
  }, [grouped]);

  // Reset state on open/close
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      if (autoFocus) {
        // Delay slightly to let the DOM settle
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    }
  }, [open, autoFocus]);

  // Clamp activeIndex
  const safeActiveIndex =
    flatItems.length === 0 ? -1 : Math.min(activeIndex, flatItems.length - 1);

  // Scroll active item into view
  useEffect(() => {
    const el = itemRefs.current.get(safeActiveIndex);
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [safeActiveIndex]);

  const selectItem = useCallback(
    (item: CommandItem) => {
      if (item.disabled) return;
      onSelect(item);
      onClose();
    },
    [onSelect, onClose],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          setActiveIndex((prev) => {
            let next = prev + 1;
            // Skip disabled items
            while (next < flatItems.length && flatItems[next]?.disabled) next++;
            return next >= flatItems.length ? 0 : next;
          });
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setActiveIndex((prev) => {
            let next = prev - 1;
            while (next >= 0 && flatItems[next]?.disabled) next--;
            return next < 0 ? flatItems.length - 1 : next;
          });
          break;
        }
        case 'Enter': {
          e.preventDefault();
          const item = flatItems[safeActiveIndex];
          if (item) {
            selectItem(item);
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          onClose();
          break;
        }
        default:
          break;
      }
    },
    [flatItems, safeActiveIndex, selectItem, onClose],
  );

  const handleItemMouseEnter = useCallback(
    (index: number) => {
      setActiveIndex(index);
    },
    [],
  );

  // Capture click on overlay (outside the panel)
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleItemClick = useCallback(
    (item: CommandItem) => {
      selectItem(item);
    },
    [selectItem],
  );

  if (!open) return null;

  let flatIndex = 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
        backgroundColor: 'rgba(0,0,0,0.35)',
      }}
      className={className}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          backgroundColor: 'var(--m5-surface, #fff)',
          borderRadius: 12,
          boxShadow:
            '0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px var(--m5-border, #e5e7eb)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            borderBottom: '1px solid var(--m5-border-subtle, #e5e7eb)',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--m5-text-tertiary, #9ca3af)"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder={placeholder}
            aria-label="Search commands"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '0.95rem',
              backgroundColor: 'transparent',
              color: 'var(--m5-text, #111827)',
              fontFamily: 'inherit',
            }}
          />
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              color: 'var(--m5-text-tertiary, #9ca3af)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          role="listbox"
          style={{
            maxHeight,
            overflowY: 'auto',
            padding: '8px',
          }}
        >
          {flatItems.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: 'var(--m5-text-tertiary, #9ca3af)',
                fontSize: '0.9rem',
              }}
            >
              {emptyMessage}
            </div>
          ) : (
            grouped.map((group) => {
              const groupStartIndex = flatIndex;

              // Render group header
              const groupHeader =
                group.group ? (
                  <div
                    key={`group-${group.group}`}
                    style={{
                      padding: '8px 12px 4px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--m5-text-tertiary, #9ca3af)',
                      marginTop: groupStartIndex > 0 ? 4 : 0,
                    }}
                  >
                    {group.group}
                  </div>
                ) : null;

              // Render items
              const items = group.items.map((item) => {
                const idx = flatIndex++;
                const isActive = idx === safeActiveIndex;

                return (
                  <div
                    key={item.id}
                    ref={(el) => {
                      if (el) itemRefs.current.set(idx, el);
                      else itemRefs.current.delete(idx);
                    }}
                    role="option"
                    aria-selected={isActive}
                    aria-disabled={item.disabled}
                    onClick={() => !item.disabled && handleItemClick(item)}
                    onMouseEnter={() => handleItemMouseEnter(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 8,
                      cursor: item.disabled ? 'not-allowed' : 'pointer',
                      opacity: item.disabled ? 0.4 : 1,
                      backgroundColor: isActive
                        ? 'var(--m5-accent-subtle, #eff6ff)'
                        : 'transparent',
                      color: isActive
                        ? 'var(--m5-accent, #2563eb)'
                        : 'var(--m5-text, #111827)',
                      transition: 'background-color 0.1s',
                    }}
                  >
                    {/* Icon */}
                    {item.icon && (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 28,
                          height: 28,
                          flexShrink: 0,
                          borderRadius: 6,
                          backgroundColor: isActive
                            ? 'var(--m5-accent, #2563eb)'
                            : 'var(--m5-surface-raised, #f3f4f6)',
                          color: isActive ? '#fff' : 'var(--m5-text-secondary, #6b7280)',
                        }}
                      >
                        {item.icon}
                      </span>
                    )}

                    {/* Label + Description */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        <HighlightedLabel label={item.label} query={query} />
                      </div>
                      {item.description && (
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--m5-text-tertiary, #9ca3af)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginTop: 1,
                          }}
                        >
                          {item.description}
                        </div>
                      )}
                    </div>

                    {/* Shortcut */}
                    {item.shortcut && (
                      <ShortcutBadge shortcut={item.shortcut} />
                    )}
                  </div>
                );
              });

              return (
                <React.Fragment key={group.group || 'ungrouped'}>
                  {groupHeader}
                  {items}
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            padding: '8px 16px',
            borderTop: '1px solid var(--m5-border-subtle, #e5e7eb)',
            fontSize: '0.72rem',
            color: 'var(--m5-text-tertiary, #9ca3af)',
          }}
        >
          <span>
            <kbd
              style={{
                fontFamily: 'ui-monospace, monospace',
                padding: '1px 4px',
                border: '1px solid var(--m5-border-subtle, #e5e7eb)',
                borderRadius: 3,
                fontSize: 'inherit',
              }}
            >
              ↑↓
            </kbd>{' '}
            Navigate
          </span>
          <span>
            <kbd
              style={{
                fontFamily: 'ui-monospace, monospace',
                padding: '1px 4px',
                border: '1px solid var(--m5-border-subtle, #e5e7eb)',
                borderRadius: 3,
                fontSize: 'inherit',
              }}
            >
              ↵
            </kbd>{' '}
            Select
          </span>
          <span>
            <kbd
              style={{
                fontFamily: 'ui-monospace, monospace',
                padding: '1px 4px',
                border: '1px solid var(--m5-border-subtle, #e5e7eb)',
                borderRadius: 3,
                fontSize: 'inherit',
              }}
            >
              esc
            </kbd>{' '}
            Close
          </span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
