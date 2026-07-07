import React from 'react';
export interface FeedbackWidgetProps {
    /** Initial rating value (0 to max). */
    initialRating?: number;
    /** Maximum rating value. */
    maxRating?: number;
    /** Rating labels per star index (1-based). */
    ratingLabels?: string[];
    /** Placeholder for the comment textarea. */
    commentPlaceholder?: string;
    /** Maximum comment length. */
    maxCommentLength?: number;
    /** Label for the submit button. */
    submitLabel?: string;
    /** Label for the cancel/reset button. */
    cancelLabel?: string;
    /** Show cancel button. */
    showCancel?: boolean;
    /** Called when feedback is submitted. */
    onSubmit?: (rating: number, comment: string) => void | Promise<void>;
    /** Called when cancelled. */
    onCancel?: () => void;
    /** Whether feedback is being submitted (shows loading). */
    submitting?: boolean;
    /** Title text displayed above the rating. */
    title?: string;
    /** Description / prompt text. */
    description?: string;
    /** Show success state after submission. */
    submitted?: boolean;
    /** Success message to show after submission. */
    successMessage?: string;
    /** Theme accent color for active star. */
    starColor?: string;
    /** Variant / style preset. */
    variant?: 'default' | 'compact' | 'minimal';
    /** Test id. */
    'data-testid'?: string;
    /** Additional container style. */
    style?: React.CSSProperties;
    /** Class name. */
    className?: string;
}
/**
 * FeedbackWidget — a reusable feedback collection component that combines
 * star rating, optional comment textarea, and submit/cancel actions.
 *
 * Used across M5 apps for store evaluations, service satisfaction surveys,
 * and user experience feedback forms.
 */
export declare function FeedbackWidget({ initialRating, maxRating, ratingLabels, commentPlaceholder, maxCommentLength, submitLabel, cancelLabel, showCancel, onSubmit, onCancel, submitting, title, description, submitted, successMessage, starColor, variant, 'data-testid': dataTestId, style, className, }: FeedbackWidgetProps): React.JSX.Element;
