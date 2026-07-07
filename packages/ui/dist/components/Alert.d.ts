import React from 'react';
export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';
export interface AlertProps {
    variant?: AlertVariant;
    title?: string;
    children: React.ReactNode;
    dismissible?: boolean;
    onDismiss?: () => void;
    icon?: boolean;
    className?: string;
    style?: React.CSSProperties;
}
export declare function Alert({ variant, title, children, dismissible, onDismiss, icon, className, style, }: AlertProps): React.JSX.Element | null;
export interface UseAlertOptions {
    variant?: AlertVariant;
    dismissAfterMs?: number;
}
export interface AlertState {
    visible: boolean;
    variant: AlertVariant;
    title: string;
    message: string;
}
export declare function useAlert(defaultOptions?: UseAlertOptions): {
    alert: AlertState | null;
    show: (title: string, message: string, variant?: AlertVariant) => void;
    info: (title: string, message: string) => void;
    success: (title: string, message: string) => void;
    warning: (title: string, message: string) => void;
    danger: (title: string, message: string) => void;
    dismiss: () => void;
};
