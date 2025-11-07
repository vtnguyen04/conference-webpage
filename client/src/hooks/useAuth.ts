// src/hooks/useAuth.ts

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/user");
        if (response.status === 401) {
          return null; // Not authenticated
        }
        return await response.json();
      } catch (err: any) {
        if (err.message.includes("401")) {
          return null; // Explicitly return null for unauthorized
        }
        throw err; // Re-throw other errors
      }
    },
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    cacheTime: 10 * 60 * 1000, // Cache data for 10 minutes
    retry: false, // Do not retry on auth checks
    refetchOnWindowFocus: false, // Do not refetch on window focus
  });

  const isAuthenticated = !!user;

  return {
    isLoading,
    isAuthenticated,
    user,
    error,
    refetch,
  };
}