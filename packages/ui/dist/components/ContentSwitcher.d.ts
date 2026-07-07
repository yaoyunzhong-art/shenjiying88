import React from 'react';
export interface ContentSwitcherSegment {
    /** Unique segment key */
    key: string;
    /** Display label */
    label: string;
    /** Optional icon */
    icon?: React.ReactNode;
    /** Optional badge count */
    badge?: number;
    /** Disabled state */
    disabled?: boolean;
}
export interface ContentSwitcherProps {
    /** Segments to display */
    segments: ContentSwitcherSegment[];
    /** Currently selected segment key — controlled mode */
    selected?: string;
    /** Default selected segment key — uncontrolled mode */
    defaultSelected?: string;
    /** Called when selected segment changes */
    onSelect?: (key: string) => void;
    /** Visual variant */
    variant?: 'bar' | 'pills';
    /** Size */
    size?: 'sm' | 'md';
    /** Full width fills container */
    fullWidth?: boolean;
    /** Test id */
    'data-testid'?: string;
}
/**
 * ContentSwitcher — a segment control for toggling between content views.
 *
 * Used for filter toggles, view switching, and tab-like navigation inside cards/panels.
 * Supports bar (underline) and pills (filled) visual variants.
 */
export declare function ContentSwitcher({ segments, selected: controlledSelected, defaultSelected, onSelect, variant, size, fullWidth, 'data-testid': dataTestId, }: ContentSwitcherProps): React.JSX.Element;
