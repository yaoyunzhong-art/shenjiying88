'use client';

import React, { useState, useCallback, useMemo } from 'react';

export interface TreeNode {
  key: string;
  label: string;
  children?: TreeNode[];
  disabled?: boolean;
  /** Custom icon shown left of the label */
  icon?: React.ReactNode;
  /** Whether the node is a leaf (has no children) */
  isLeaf?: boolean;
  /** Any extra data */
  data?: Record<string, unknown>;
}

export interface TreeProps {
  /** Tree data */
  treeData: TreeNode[];
  /** Tree variant */
  variant?: 'default' | 'directory' | 'minimal';
  /** Selection mode */
  selectable?: boolean;
  /** Whether to show checkboxes */
  checkable?: boolean;
  /** Default expanded keys */
  defaultExpandedKeys?: string[];
  /** Controlled expanded keys */
  expandedKeys?: string[];
  /** On expand change (controlled) */
  onExpand?: (keys: string[]) => void;
  /** Default selected keys */
  defaultSelectedKeys?: string[];
  /** Controlled selected keys */
  selectedKeys?: string[];
  /** On selection change (controlled, selectable mode) */
  onSelect?: (keys: string[]) => void;
  /** Default checked keys (checkable mode) */
  defaultCheckedKeys?: string[];
  /** Controlled checked keys */
  checkedKeys?: string[];
  /** On check change (checkable mode) */
  onCheck?: (keys: string[]) => void;
  /** Called when a node is clicked */
  onNodeClick?: (node: TreeNode, event: React.MouseEvent) => void;
  /** Render custom node content */
  renderNode?: (node: TreeNode, expanded: boolean, selected: boolean) => React.ReactNode;
  /** Allow multiple selection (selectable mode, no checkboxes) */
  multiple?: boolean;
  /** Auto expand parent of selected node */
  autoExpandParent?: boolean;
  /** Size */
  size?: 'sm' | 'md';
  /** Height constraint with scroll */
  maxHeight?: number | string;
  /** Test id */
  'data-testid'?: string;
  /** Extra class */
  className?: string;
  /** Inline style */
  style?: React.CSSProperties;
}

const INDENT = 20;
const NODE_HEIGHT: Record<string, number> = { sm: 28, md: 34 };
const FONT_SIZE: Record<string, number> = { sm: 13, md: 14 };
const ICON_SIZE: Record<string, number> = { sm: 12, md: 14 };
const CHEVRON_SIZE: Record<string, number> = { sm: 8, md: 10 };

function ChevronIcon({ expanded, size = 'md' }: { expanded: boolean; size?: 'sm' | 'md' }) {
  const s = CHEVRON_SIZE[size];
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 10 10"
      style={{
        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.18s ease',
        flexShrink: 0,
        marginRight: 4,
      }}
    >
      <path
        d="M3.5 1.5L7 5L3.5 8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width={10} height={8} viewBox="0 0 10 8" style={{ flexShrink: 0 }}>
      <path
        d="M1 4L3.5 6.5L9 1"
        fill="none"
        stroke="white"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HalfCheckIcon() {
  return (
    <svg width={8} height={2} viewBox="0 0 8 2" style={{ flexShrink: 0 }}>
      <rect x={1} y={0} width={6} height={2} rx={1} fill="white" />
    </svg>
  );
}

function FolderIcon({ open }: { open: boolean }) {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 14 14"
      style={{ flexShrink: 0, marginRight: 5, opacity: 0.6 }}
    >
      {open ? (
        <path
          d="M1.5 2.5H5L6.5 4H12.5V11.5H1.5V2.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M1.5 2.5H5L6.5 4H12.5V11.5H1.5V2.5Z"
          fill="rgba(148,163,184,0.15)"
          stroke="currentColor"
          strokeWidth={1}
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      width={12}
      height={14}
      viewBox="0 0 12 14"
      style={{ flexShrink: 0, marginRight: 5, opacity: 0.5 }}
    >
      <path
        d="M7 1H2.5C1.95 1 1.5 1.45 1.5 2V12C1.5 12.55 1.95 13 2.5 13H9.5C10.05 13 10.5 12.55 10.5 12V4.5L7 1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeLinejoin="round"
      />
      <path
        d="M7 1V4.5H10.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Collect all keys from tree
function getAllKeys(nodes: TreeNode[]): string[] {
  const keys: string[] = [];
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      keys.push(n.key);
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  return keys;
}

// Get all descendant keys
function getDescendantKeys(node: TreeNode): string[] {
  const keys: string[] = [];
  if (!node.children) return keys;
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      keys.push(n.key);
      if (n.children) walk(n.children);
    }
  };
  walk(node.children);
  return keys;
}

// Get all parent keys for a given key
function getParentKeys(treeData: TreeNode[], targetKey: string): string[] {
  const parents: string[] = [];
  const walk = (nodes: TreeNode[], path: string[]): boolean => {
    for (const n of nodes) {
      if (n.key === targetKey) {
        parents.push(...path);
        return true;
      }
      if (n.children && walk(n.children, [...path, n.key])) {
        return true;
      }
    }
    return false;
  };
  walk(treeData, []);
  return parents;
}

// Find a node by key
function findNode(nodes: TreeNode[], key: string): TreeNode | null {
  for (const n of nodes) {
    if (n.key === key) return n;
    if (n.children) {
      const found = findNode(n.children, key);
      if (found) return found;
    }
  }
  return null;
}

interface TreeNodeRowProps {
  node: TreeNode;
  depth: number;
  expanded: boolean;
  hasChildren: boolean;
  selected: boolean;
  checked: boolean | 'half';
  variant: TreeProps['variant'];
  selectable: boolean;
  checkable: boolean;
  size: 'sm' | 'md';
  renderNode?: TreeProps['renderNode'];
  onToggle: (key: string) => void;
  onSelect: (key: string) => void;
  onCheck: (key: string) => void;
  onClick: (node: TreeNode, event: React.MouseEvent) => void;
}

const TreeNodeRow = React.memo(function TreeNodeRow({
  node,
  depth,
  expanded,
  hasChildren,
  selected,
  checked,
  variant,
  selectable,
  checkable,
  size,
  renderNode,
  onToggle,
  onSelect,
  onCheck,
  onClick,
}: TreeNodeRowProps) {
  const nodeH = NODE_HEIGHT[size];
  const fontSize = FONT_SIZE[size];

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      onClick(node, e);
      if (hasChildren) onToggle(node.key);
      if (selectable) onSelect(node.key);
    },
    [node, hasChildren, selectable, onToggle, onSelect, onClick],
  );

  const handleCheckClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!node.disabled) onCheck(node.key);
    },
    [node.disabled, node.key, onCheck],
  );

  const isDirectory = variant === 'directory' && hasChildren;

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    height: nodeH,
    paddingLeft: depth * INDENT + 8,
    paddingRight: 8,
    cursor: node.disabled ? 'not-allowed' : 'pointer',
    fontSize,
    color: node.disabled ? 'rgba(148,163,184,0.45)' : selected ? '#0f172a' : '#334155',
    fontWeight: selected ? 600 : 400,
    backgroundColor: selected ? 'rgba(59,130,246,0.08)' : 'transparent',
    borderRadius: 6,
    marginInline: 4,
    marginBlock: 1,
    userSelect: 'none',
    opacity: node.disabled ? 0.5 : 1,
    transition: 'background-color 0.12s ease',
  };

  return (
    <div
      style={rowStyle}
      role="treeitem"
      aria-expanded={hasChildren ? expanded : undefined}
      aria-selected={selected}
      aria-disabled={node.disabled}
      onClick={handleClick}
      data-tree-key={node.key}
    >
      {/* Expand chevron */}
      <span style={{ width: (CHEVRON_SIZE[size] ?? 10) + 4, display: 'inline-flex', alignItems: 'center' }}>
        {hasChildren && <ChevronIcon expanded={expanded} size={size} />}
      </span>

      {/* Checkbox */}
      {checkable && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: size === 'sm' ? 14 : 16,
            height: size === 'sm' ? 14 : 16,
            borderRadius: 4,
            border:
              checked === true
                ? '1.5px solid #3b82f6'
                : checked === 'half'
                  ? '1.5px solid #3b82f6'
                  : '1.5px solid rgba(148,163,184,0.5)',
            backgroundColor:
              checked === true || checked === 'half' ? '#3b82f6' : 'transparent',
            marginRight: 6,
            flexShrink: 0,
            cursor: node.disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.12s ease',
          }}
          onClick={handleCheckClick}
          data-tree-check={node.key}
        >
          {checked === true && <CheckIcon />}
          {checked === 'half' && <HalfCheckIcon />}
        </span>
      )}

      {/* Icon */}
      {variant === 'directory' ? (
        isDirectory ? (
          <FolderIcon open={expanded} />
        ) : (
          <FileIcon />
        )
      ) : node.icon ? (
        <span style={{ marginRight: 5, display: 'inline-flex', opacity: 0.65 }}>{node.icon}</span>
      ) : null}

      {/* Label */}
      {renderNode ? (
        renderNode(node, expanded, selected)
      ) : (
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {node.label}
        </span>
      )}
    </div>
  );
});

/**
 * Tree — hierarchical data display with expand/collapse, selection, and checkboxes.
 *
 * Supports directory variant (folder/file icons), controlled/uncontrolled expansion,
 * single or multiple selection, and fully controlled checkbox mode with parent-child
 * cascade logic.
 */
export function Tree({
  treeData,
  variant = 'default',
  selectable = false,
  checkable = false,
  defaultExpandedKeys,
  expandedKeys: controlledExpandedKeys,
  onExpand,
  defaultSelectedKeys,
  selectedKeys: controlledSelectedKeys,
  onSelect,
  defaultCheckedKeys,
  checkedKeys: controlledCheckedKeys,
  onCheck,
  onNodeClick,
  renderNode,
  multiple = false,
  autoExpandParent = true,
  size = 'md',
  maxHeight,
  'data-testid': testId,
  className,
  style,
}: TreeProps) {
  // Expand state
  const [internalExpanded, setInternalExpanded] = useState<string[]>(defaultExpandedKeys ?? []);
  const isExpandedControlled = controlledExpandedKeys !== undefined;
  const expandedSet = new Set(isExpandedControlled ? controlledExpandedKeys! : internalExpanded);

  const handleExpandToggle = useCallback(
    (key: string) => {
      const current = isExpandedControlled ? controlledExpandedKeys! : internalExpanded;
      let next: string[];
      if (current.includes(key)) {
        next = current.filter((k) => k !== key);
      } else {
        next = [...current, key];
      }
      if (!isExpandedControlled) setInternalExpanded(next);
      onExpand?.(next);
    },
    [isExpandedControlled, controlledExpandedKeys, internalExpanded, onExpand],
  );

  // Selection state
  const [internalSelected, setInternalSelected] = useState<string[]>(defaultSelectedKeys ?? []);
  const isSelectedControlled = controlledSelectedKeys !== undefined;
  const selectedSet = useMemo(
    () => new Set(isSelectedControlled ? controlledSelectedKeys! : internalSelected),
    [isSelectedControlled, controlledSelectedKeys, internalSelected],
  );

  const handleSelect = useCallback(
    (key: string) => {
      if (!selectable) return;
      const current = isSelectedControlled ? controlledSelectedKeys! : internalSelected;
      let next: string[];
      if (multiple) {
        next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
      } else {
        next = current.includes(key) ? [] : [key];
      }
      if (!isSelectedControlled) setInternalSelected(next);
      onSelect?.(next);
    },
    [selectable, multiple, isSelectedControlled, controlledSelectedKeys, internalSelected, onSelect],
  );

  // Check state
  const [internalChecked, setInternalChecked] = useState<string[]>(defaultCheckedKeys ?? []);
  const isCheckedControlled = controlledCheckedKeys !== undefined;
  const checkedSet = useMemo(
    () => new Set(isCheckedControlled ? controlledCheckedKeys! : internalChecked),
    [isCheckedControlled, controlledCheckedKeys, internalChecked],
  );

  const handleCheck = useCallback(
    (key: string) => {
      if (!checkable) return;
      const current = new Set(isCheckedControlled ? controlledCheckedKeys! : internalChecked);
      let next: string[];

      const node = findNode(treeData, key);
      if (!node) return;

      const descKeys = getDescendantKeys(node);
      const allChildKeys = [key, ...descKeys];

      if (current.has(key)) {
        // Uncheck this node and all descendants
        for (const k of allChildKeys) current.delete(k);
        // Uncheck ancestors that no longer have all children checked
        const parentKeys = getParentKeys(treeData, key);
        // We'll recalculate below
      } else {
        // Check this node and all descendants
        for (const k of allChildKeys) current.add(k);
        // Check ancestors if all siblings are checked
      }

      // Fully recalculate: for each node, if all children are checked → check parent
      const allKeys = getAllKeys(treeData);
      const finalSet = new Set(current);

      // Bottom-up: if all children checked → parent checked
      for (const k of allKeys) {
        const n = findNode(treeData, k);
        if (n?.children && n.children.length > 0) {
          const allChildrenChecked = n.children.every((c) => finalSet.has(c.key));
          if (allChildrenChecked) {
            finalSet.add(k);
          } else {
            finalSet.delete(k);
          }
        }
      }

      next = [...finalSet];
      if (!isCheckedControlled) setInternalChecked(next);
      onCheck?.(next);
    },
    [checkable, treeData, isCheckedControlled, controlledCheckedKeys, internalChecked, onCheck],
  );

  const getCheckedStatus = useCallback(
    (node: TreeNode): boolean | 'half' => {
      if (!checkable) return false;
      if (checkedSet.has(node.key)) {
        // Check if all children are also checked
        if (node.children && node.children.length > 0) {
          const allDescChecked = getDescendantKeys(node).every((k) => checkedSet.has(k));
          return allDescChecked ? true : 'half';
        }
        return true;
      }
      // Not checked, but some children may be
      if (node.children && node.children.length > 0) {
        const someDescChecked = getDescendantKeys(node).some((k) => checkedSet.has(k));
        return someDescChecked ? 'half' : false;
      }
      return false;
    },
    [checkable, checkedSet],
  );

  const handleNodeClick = useCallback(
    (node: TreeNode, event: React.MouseEvent) => {
      onNodeClick?.(node, event);
    },
    [onNodeClick],
  );

  // Auto expand parent of selected node
  const effectiveExpanded = useMemo(() => {
    if (!autoExpandParent) return expandedSet;
    const set = new Set(expandedSet);
    const selectedKeysArr = isSelectedControlled ? controlledSelectedKeys! : internalSelected;
    for (const sk of selectedKeysArr) {
      const parents = getParentKeys(treeData, sk);
      for (const p of parents) set.add(p);
    }
    return set;
  }, [autoExpandParent, expandedSet, isSelectedControlled, controlledSelectedKeys, internalSelected, treeData]);

  const containerStyle: React.CSSProperties = {
    maxHeight: maxHeight ?? undefined,
    overflowY: maxHeight ? 'auto' : 'visible',
    padding: '4px 0',
    ...(variant === 'default'
      ? { border: '1px solid rgba(148,163,184,0.14)', borderRadius: 12 }
      : {}),
    ...style,
  };

  // Render tree recursively
  const renderTree = (nodes: TreeNode[], depth: number = 0): React.ReactNode[] => {
    return nodes.map((node) => {
      const hasChildren = !!node.children && node.children.length > 0 && !node.isLeaf;
      const isExpanded = effectiveExpanded.has(node.key);
      const isSelected = selectedSet.has(node.key);
      const checkedStatus = getCheckedStatus(node);

      const children = hasChildren && isExpanded ? renderTree(node.children!, depth + 1) : null;

      return (
        <React.Fragment key={node.key}>
          <TreeNodeRow
            node={node}
            depth={depth}
            expanded={isExpanded}
            hasChildren={hasChildren}
            selected={isSelected}
            checked={checkedStatus}
            variant={variant}
            selectable={selectable}
            checkable={checkable}
            size={size}
            renderNode={renderNode}
            onToggle={handleExpandToggle}
            onSelect={handleSelect}
            onCheck={handleCheck}
            onClick={handleNodeClick}
          />
          {children}
        </React.Fragment>
      );
    });
  };

  return (
    <div
      role="tree"
      data-testid={testId}
      className={className}
      style={containerStyle}
    >
      {renderTree(treeData)}
    </div>
  );
}

export default Tree;
