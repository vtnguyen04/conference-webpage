import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { ApiError } from "@/services/apiClient";

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  // Parse JSON response for non-DELETE requests
  if (method !== "DELETE" && res.headers.get("content-type")?.includes("application/json")) {
    return await res.json();
  }
  // For DELETE requests or non-JSON responses, return success status or empty object
  return {};
}

export async function apiUploadFile(
  url: string,
  formData: FormData,
): Promise<any> {
  const res = await fetch(url, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const joined = queryKey.join("/");
    const url = ("/" + joined).replace(/\/+/g, "/");
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText || `Error ${res.status}`;
    
    try {
      const data = await res.json();
      if (data && data.message) {
        errorMessage = data.message;
      }
    } catch (e) {
      // Not a JSON response
    }

    throw new ApiError(errorMessage, res.status);
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 401 or 404
        if (error instanceof ApiError && (error.status === 401 || error.status === 404)) return false;
        if (error?.status === 401 || error?.status === 404) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
