import React from 'react';
interface InfoRowProps {
    label: string;
    value: React.ReactNode;
    labelColor?: string;
    valueColor?: string;
    labelFontSize?: number;
    valueFontSize?: number;
    gap?: number;
}
export declare function InfoRow({ label, value, labelColor, valueColor, labelFontSize, valueFontSize, gap, }: InfoRowProps): React.JSX.Element;
interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger';
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}
export declare function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel, variant, onConfirm, onCancel, loading, }: ConfirmDialogProps): React.JSX.Element | null;
export {};
