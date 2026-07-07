import React from 'react';
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
export declare function CommandPalette({ commands, open, onClose, onSelect, placeholder, emptyMessage, maxHeight, autoFocus, className, }: CommandPaletteProps): React.JSX.Element | null;
export default CommandPalette;
