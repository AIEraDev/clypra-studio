import { QueryClient } from "@tanstack/react-query";

/** Shared server-state cache for Studio API/R2 resources. */
export const studioQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 10 * 60 * 1000,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
      retry: 2,
      staleTime: 30 * 1000,
    },
  },
});
