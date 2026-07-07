import React from 'react';
import { type DetailActionBarAction } from './DetailActionBar';
import { type DetailClosureLink } from './DetailClosureBar';
export interface DetailInfoRow {
    key: string;
    label: string;
    value: React.ReactNode;
    /** Optional inline status badge next to value. */
    statusBadge?: {
        label: string;
        variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
    };
}
export interface DetailTab {
    key: string;
    label: string;
    content: React.ReactNode;
}
export interface TransitionAction {
    key: string;
    label: string;
    /** Target status after transition. */
    targetStatus: string;
    variant?: 'primary' | 'secondary' | 'danger';
    /** Optional confirmation dialog before executing transition. */
    confirm?: {
        title: string;
        message: string;
    };
    onTransition: () => void | Promise<void>;
}
export interface CombinedDetailPageProps {
    /** Main title for the detail page. */
    title: string;
    /** Subtitle — often the entity id or a short descriptor. */
    subtitle?: string;
    /** Back navigation. */
    backHref?: string;
    backLabel?: string;
    onBack?: () => void;
    /** Current status to render as a status badge. */
    status?: {
        label: string;
        variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
    };
    /** Info rows shown above tabs. */
    infoRows?: DetailInfoRow[];
    /** Tabs for organizing detail content. */
    tabs?: DetailTab[];
    /** Default active tab key. */
    defaultTab?: string;
    /** Edit action — shown as a primary button in the shell actions. */
    onEdit?: () => void;
    editLabel?: string;
    /** Delete action with built-in confirmation dialog. */
    onDelete?: () => void | Promise<void>;
    deleteLabel?: string;
    deleteConfirm?: {
        title: string;
        message: string;
    };
    /** Status transition actions rendered below info rows. */
    transitions?: TransitionAction[];
    /** Closure bar links. */
    closureLinks?: DetailClosureLink[];
    /** Detail action bar actions (copy, export etc.). */
    actionBarActions?: DetailActionBarAction[];
    /** Loading state. */
    loading?: boolean;
    /** Error message. */
    error?: string;
    /** Test id. */
    'data-testid'?: string;
}
export declare function CombinedDetailPage({ title, subtitle, backHref, backLabel, onBack, status, infoRows, tabs, defaultTab, onEdit, editLabel, onDelete, deleteLabel, deleteConfirm, transitions, closureLinks, actionBarActions, loading, error, 'data-testid': testId, }: CombinedDetailPageProps): React.JSX.Element;
export default CombinedDetailPage;
