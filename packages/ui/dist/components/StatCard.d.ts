import React from 'react';
interface StatCardProps {
    label: string;
    value: string | number;
    trend?: {
        value: string;
        positive: boolean;
    };
    icon?: React.ReactNode;
    variant?: 'default' | 'info' | 'warning' | 'error' | 'success';
    helper?: React.ReactNode;
}
export declare function StatCard({ label, value, trend, icon, variant, helper }: StatCardProps): React.JSX.Element;
export {};
