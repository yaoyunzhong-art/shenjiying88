import React from 'react';
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
/**
 * Tree — hierarchical data display with expand/collapse, selection, and checkboxes.
 *
 * Supports directory variant (folder/file icons), controlled/uncontrolled expansion,
 * single or multiple selection, and fully controlled checkbox mode with parent-child
 * cascade logic.
 */
export declare function Tree({ treeData, variant, selectable, checkable, defaultExpandedKeys, expandedKeys: controlledExpandedKeys, onExpand, defaultSelectedKeys, selectedKeys: controlledSelectedKeys, onSelect, defaultCheckedKeys, checkedKeys: controlledCheckedKeys, onCheck, onNodeClick, renderNode, multiple, autoExpandParent, size, maxHeight, 'data-testid': testId, className, style, }: TreeProps): React.JSX.Element;
export default Tree;
