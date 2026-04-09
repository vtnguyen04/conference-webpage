import { useQuery } from "@tanstack/react-query";
import { apiRequest, ApiError } from "@/services/apiClient";

interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  assignedSessionIds?: string[];
}

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const response: any = await apiRequest("GET", "/api/auth/user");
        if (response && response.user) {
          return response.user as AuthUser;
        }
        return null; // Not logged in
      } catch (err: any) {
        if (err instanceof ApiError && err.status === 401) return null;
        if (err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 0,
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
