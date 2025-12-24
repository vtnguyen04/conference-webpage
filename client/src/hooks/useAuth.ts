// src/hooks/useAuth.ts

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/services/apiClient";

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
        const user = await apiRequest("GET", "/api/auth/user");
        return user as AuthUser;
      } catch (err: any) {
        // apiRequest now throws an error for non-ok responses
        // Check if the error message indicates a 401 Unauthorized status
        if (err.message && err.message.includes("401")) {
          return null; // Not authenticated
        }
        throw err; // Re-throw other errors
      }
    },
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Garbage collect data after 10 minutes
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