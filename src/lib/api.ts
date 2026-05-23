export async function bwhApi<T = unknown>(action: string, params: Record<string, string> = {}): Promise<T> {
  const res = await fetch("/api/bwh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });

  const data = await res.json();

  if (!res.ok || data.error !== 0) {
    throw new Error(data.message || `API call ${action} failed`);
  }

  return data as T;
}
