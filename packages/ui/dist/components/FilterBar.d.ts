import React from 'react';
interface FilterChip {
    key: string;
    label: string;
    active: boolean;
    onClick: () => void;
}
interface FilterBarProps {
    chips: FilterChip[];
    onClearAll?: () => void;
    activeCount?: number;
}
export declare function FilterBar({ chips, onClearAll, activeCount }: FilterBarProps): React.JSX.Element;
export {};
