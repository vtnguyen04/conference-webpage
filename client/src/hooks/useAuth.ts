// src/hooks/useAuth.ts

import { useQuery } from "@tanstack/react-query";
import { apiRequest, ApiError } from "@/services/apiClient";

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
        // Check for 401 Unauthorized using status code or ApiError
        if (err instanceof ApiError && err.status === 401) {
          return null;
        }
        if (err.status === 401) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 0, // Auth status should be checked frequently
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: true,
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