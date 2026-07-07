import React from 'react';
interface TabItem<T extends string = string> {
    key: T;
    label: string;
    count?: number;
}
interface TabsProps<T extends string = string> {
    items: TabItem<T>[];
    activeKey: T;
    onChange: (key: T) => void;
    variant?: 'underline' | 'segment' | 'pills';
    size?: 'sm' | 'md';
    fill?: boolean;
}
export declare function Tabs<T extends string = string>({ items, activeKey, onChange, variant, size, fill, }: TabsProps<T>): React.JSX.Element | null;
export {};
