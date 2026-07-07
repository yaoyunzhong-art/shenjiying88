import React from 'react';
export interface AccordionItem {
    key: string;
    title: string;
    content: React.ReactNode;
    disabled?: boolean;
    subtitle?: string;
}
export interface AccordionProps {
    items: AccordionItem[];
    /** Allow multiple items to be open simultaneously */
    multiple?: boolean;
    /** Default expanded item keys */
    defaultExpanded?: string[];
    /** Controlled expanded keys */
    expanded?: string[];
    /** Change handler for controlled mode */
    onExpandedChange?: (keys: string[]) => void;
    /** Visual variant */
    variant?: 'default' | 'bordered' | 'minimal';
    /** Size */
    size?: 'sm' | 'md';
}
export declare function Accordion({ items, multiple, defaultExpanded, expanded: controlledExpanded, onExpandedChange, variant, size, }: AccordionProps): React.JSX.Element | null;
export default Accordion;
