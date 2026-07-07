import React from 'react';
interface PaginationProps {
    page: number;
    total: number;
    onPageChange: (page: number) => void;
    totalPages?: number;
    pageSize?: number;
    onPageSizeChange?: (pageSize: number) => void;
    pageSizeOptions?: number[];
    size?: 'sm' | 'md';
}
interface LegacyPaginationOptions {
    initialPage?: number;
    initialPageSize?: number;
    pageSizeOptions?: number[];
}
export declare function usePagination(total: number, pageSize: number, initialPage?: number): {
    page: number;
    pageSize: number;
    totalPages: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    setPageSize: React.Dispatch<React.SetStateAction<number>>;
    total: number;
    resetPage: () => void;
    paginate: <T>(items: T[]) => T[];
};
export declare function usePagination(options: LegacyPaginationOptions): {
    page: number;
    pageSize: number;
    totalPages: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    setPageSize: React.Dispatch<React.SetStateAction<number>>;
    total: number;
    resetPage: () => void;
    paginate: <T>(items: T[]) => T[];
};
export declare function Pagination({ page, total, totalPages, onPageChange, pageSize, onPageSizeChange, pageSizeOptions, size, }: PaginationProps): React.JSX.Element;
export {};
