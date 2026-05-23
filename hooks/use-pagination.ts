'use client';

import { useState } from 'react';

export interface PaginationState {
  page: number;
  limit: number;
}

export function usePagination(initial: PaginationState = { page: 1, limit: 20 }) {
  const [pagination, setPagination] = useState<PaginationState>(initial);
  return {
    pagination,
    setPagination,
    setPage: (page: number) => setPagination((p) => ({ ...p, page })),
    setLimit: (limit: number) => setPagination(() => ({ page: 1, limit })),
    reset: () => setPagination(initial),
  };
}
