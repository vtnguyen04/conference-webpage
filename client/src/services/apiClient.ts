async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
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
