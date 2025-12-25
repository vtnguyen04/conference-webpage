export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText || `Error ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.message) {
        errorMessage = data.message;
      } else if (data && typeof data === 'string') {
        errorMessage = data;
      }
    } catch (e) {
    }
    if (res.status === 401) {
      throw new ApiError("Mật khẩu không chính xác hoặc phiên đăng nhập đã hết hạn.", 401);
    }
    throw new ApiError(errorMessage, res.status);
  }
}
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    await throwIfResNotOk(res);
    if (method !== "DELETE" && res.headers.get("content-type")?.includes("application/json")) {
      return await res.json();
    }
    return {};
  } catch (error) {
    throw error;
  }
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
