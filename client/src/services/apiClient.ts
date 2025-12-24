async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    console.error(`[API Error] Status: ${res.status}, Body: ${text}`); // Log error details
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  console.log(`[API Request] ${method}: ${url}`, data ? { payload: data } : ''); // Log outgoing request
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    
    if (method !== "DELETE" && res.headers.get("content-type")?.includes("application/json")) {
      const jsonResponse = await res.json();
      console.log(`[API Response] ${method}: ${url}`, jsonResponse); // Log successful JSON response
      return jsonResponse;
    }

    console.log(`[API Response] ${method}: ${url}`, 'Success (No JSON)'); // Log success for non-JSON response
    return {};
  } catch (error) {
    console.error(`[API Failure] ${method}: ${url}`, error); // Log network failures or errors from throwIfResNotOk
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