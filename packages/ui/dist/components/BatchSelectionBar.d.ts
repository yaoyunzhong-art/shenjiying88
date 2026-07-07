import React from 'react';
export interface BatchAction<T = string> {
    /** Unique action key */
    key: T;
    /** Display label */
    label: string;
    /** Optional icon (render before label) */
    icon?: React.ReactNode;
    /** Visual variant */
    variant?: 'primary' | 'danger' | 'default' | 'outline';
    /** Whether this action requires confirmation before execution */
    requireConfirm?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Tooltip / aria description */
    description?: string;
}
export interface BatchSelectionBarProps<T = string> {
    /** Number of selected items */
    selectedCount: number;
    /** Total items (used to show "All N selected") */
    totalCount?: number;
    /** Human-readable item label, e.g. "orders", "users" */
    itemLabel?: string;
    /** Available batch actions */
    actions: BatchAction<T>[];
    /** Called when an action is invoked */
    onAction: (actionKey: T) => void;
    /** Called when user clicks "Clear selection" */
    onClearSelection: () => void;
    /** Custom test id */
    'data-testid'?: string;
}
export declare function BatchSelectionBar<T extends string = string>({ selectedCount, totalCount, itemLabel, actions, onAction, onClearSelection, 'data-testid': testId, }: BatchSelectionBarProps<T>): React.JSX.Element | null;
