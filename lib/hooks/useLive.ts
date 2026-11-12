"use client";

import useSWR, { SWRConfiguration } from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json();
};

/**
 * Enterprise live polling hook.
 * Abstracts 3s short-polling behind a unified interface ready for Pusher/Ably swap.
 */
export function useLive<T = any>(
  url: string | null,
  options?: SWRConfiguration
) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    url,
    fetcher,
    {
      refreshInterval: 3000, // 3s polling for live boards as per spec
      revalidateOnFocus: true,
      dedupingInterval: 1500,
      ...options,
    }
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    isReconnecting: !!error || (isValidating && !data),
    mutate,
  };
}
