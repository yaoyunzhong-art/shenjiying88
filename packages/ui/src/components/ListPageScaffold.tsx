'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { type DataTableSortConfig, useSearchFilter, useSortedItems } from './LinkedOverviewStubs';
import { usePagination } from './Pagination';

export const listPageStatCardStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
};

export interface ListPageFacetConfig<T> {
  key: string;
  order?: readonly string[];
  enabled?: boolean;
  getValue: (item: T) => string;
}

export interface ListPageFacetState<T> {
  key: string;
  order: readonly string[];
  enabled: boolean;
  value: string;
  baseItems: T[];
  filteredItems: T[];
}

interface UseListPageSectionStateOptions<T> {
  items: T[];
  searchFields: Array<keyof T | string>;
  facets: ListPageFacetConfig<T>[];
  defaultPageSize?: number;
  pageSizeOptions?: number[];
}

export function useListPageSectionState<T>({
  items,
  searchFields,
  facets,
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
}: UseListPageSectionStateOptions<T>) {
  const { searchTerm, setSearchTerm, filteredItems: searchFilteredItems } = useSearchFilter(items, searchFields);
  const [facetValues, setFacetValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(facets.map((facet) => [facet.key, 'ALL']))
  );

  const facetValueSignature = useMemo(
    () => facets.map((facet) => `${facet.key}:${facetValues[facet.key] ?? 'ALL'}`).join('|'),
    [facetValues, facets]
  );

  const resolvedFacets = useMemo<ListPageFacetState<T>[]>(() => {
    let currentItems = searchFilteredItems;

    return facets.map((facet) => {
      const enabled = facet.enabled ?? true;
      const order =
        facet.order && facet.order.length > 0
          ? [...facet.order]
          : Array.from(new Set(items.map((item) => facet.getValue(item))));
      const value = facetValues[facet.key] ?? 'ALL';
      const baseItems = currentItems;
      const filteredItems =
        !enabled || value === 'ALL' ? baseItems : baseItems.filter((item) => facet.getValue(item) === value);

      currentItems = filteredItems;

      return {
        key: facet.key,
        order,
        enabled,
        value,
        baseItems,
        filteredItems,
      };
    });
  }, [facetValues, facets, items, searchFilteredItems]);

  const filteredItems = resolvedFacets.at(-1)?.filteredItems ?? searchFilteredItems;
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const sortedItems = useSortedItems(filteredItems, [], sortConfig);
  const pagination = usePagination({ initialPageSize: defaultPageSize, pageSizeOptions });

  useEffect(() => {
    pagination.resetPage();
  }, [facetValueSignature, pagination, searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    searchFilteredItems,
    facets: resolvedFacets,
    filteredItems,
    sortConfig,
    setSortConfig,
    sortedItems,
    pagedItems: pagination.paginate(sortedItems),
    pagination,
    totalPages: Math.max(1, Math.ceil(sortedItems.length / Math.max(pagination.pageSize, 1))),
    setFacetValue: (key: string, value: string) => {
      setFacetValues((current) => ({
        ...current,
        [key]: value,
      }));
    },
  };
}
