import React from 'react';
interface SearchFilterInputProps {
    value: string;
    onChange: (value: string) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    placeholder?: string;
    debounceMs?: number;
    /** 显示清空按钮（默认 true） */
    clearable?: boolean;
    /** 宽度覆盖 */
    width?: number | string;
    /** 禁用状态 */
    disabled?: boolean;
}
export declare function useSearchFilter(initialValue?: string, debounceMs?: number): {
    value: string;
    debouncedValue: string;
    setValue: (value: string) => void;
};
export declare function SearchFilterInput({ value, onChange, onKeyDown, placeholder, debounceMs, clearable, width, disabled, }: SearchFilterInputProps): React.JSX.Element;
export {};
