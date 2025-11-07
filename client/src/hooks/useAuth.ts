// src/hooks/useAuth.ts

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Định nghĩa một kiểu dữ liệu rõ ràng cho kết quả trả về từ API
// Điều này giúp TypeScript thông minh hơn
type AuthCheckResponse = {
  isAuthenticated: boolean;
};

export function useAuth() {
  const { data, isLoading, error, refetch } = useQuery<AuthCheckResponse>({ 
    queryKey: ["authCheck"],
    // SỬA LỖI NẰM Ở ĐÂY:
    queryFn: async (): Promise<AuthCheckResponse> => {
      // 1. Chờ cho request hoàn tất và nhận về đối tượng Response thô
      const response = await apiRequest("GET", "/api/auth/check");

      // 2. (Rất quan trọng) Kiểm tra xem request có thành công không (status 200-299)
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      // 3. "Mở hộp" và lấy dữ liệu JSON bên trong, sau đó trả về nó
      return response.json(); 
    },
    retry: false,
  });

  return {
    isLoading,
    // Dữ liệu 'data' bây giờ đã có kiểu đúng, không cần kiểm tra 'NonNullable' nữa
    isAuthenticated: data?.isAuthenticated || false,
    error,
    refetch,
  };
}