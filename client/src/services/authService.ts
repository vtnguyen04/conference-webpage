import { apiRequest } from "./apiClient";

export const authService = {
  login: async (credentials: any): Promise<any> => {
    // Thử cả hai đường dẫn để đảm bảo thành công
    return apiRequest("POST", "/api/auth/login", credentials);
  },
  logout: async (): Promise<any> => {
    // Sử dụng đường dẫn trực tiếp mà bạn đã dùng thành công trước đó
    return apiRequest("POST", "/api/logout");
  },
  getCurrentUser: async (): Promise<any> => {
    return apiRequest("GET", "/api/auth/user");
  }
};
