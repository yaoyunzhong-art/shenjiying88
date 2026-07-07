import React from 'react';
export type TimelineItemVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
export interface TimelineItem {
    /** Unique key for the item */
    key: string;
    /** Timestamp or heading text */
    heading: string;
    /** Optional subtitle / secondary text */
    subtitle?: string;
    /** Body content */
    content?: React.ReactNode;
    /** Visual variant for the dot + connecting line */
    variant?: TimelineItemVariant;
    /** Custom icon instead of the default dot */
    icon?: React.ReactNode;
    /** Whether this item represents a pending / future state */
    pending?: boolean;
}
export interface TimelineProps {
    /** Ordered list of timeline items (top to bottom) */
    items: TimelineItem[];
    /** Test id */
    'data-testid'?: string;
}
export declare const Timeline: React.FC<TimelineProps>;
export default Timeline;
