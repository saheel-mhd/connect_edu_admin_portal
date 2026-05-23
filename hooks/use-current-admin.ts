'use client';

import { useQuery } from '@tanstack/react-query';
import type { ApiSuccess } from '@/types/api';
import type { AdminUser } from '@/types/auth';
import { queryKeys } from '@/lib/utils/query-keys';

/** Loads the current admin via the Next.js BFF /api/auth/me endpoint. */
export function useCurrentAdmin() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.currentAdmin,
    queryFn: async () => {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) throw new Error('Not authenticated');
      const body = (await res.json()) as ApiSuccess<AdminUser>;
      return body.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return { admin: data ?? null, isLoading, error, refetch };
}
