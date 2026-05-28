import { LoyversePaginatedResponse } from "./types";

const BASE_URL = "https://api.loyverse.com/v1.0";

function getToken(): string {
  const token = process.env.LOYVERSE_ACCESS_TOKEN;
  if (!token) throw new Error("LOYVERSE_ACCESS_TOKEN is not set");
  return token;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Loyverse API error ${res.status}: ${body}`);
  }

  return res.json();
}

export async function fetchAllPages<T>(
  path: string,
  dataKey: string
): Promise<T[]> {
  const results: T[] = [];
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    const qs = params.toString();
    const url = qs ? `${path}?${qs}` : path;

    const response = await request<LoyversePaginatedResponse<T>>(url);
    const items = (response as Record<string, T[]>)[dataKey] || [];
    results.push(...items);
    cursor = response.cursor || undefined;
  } while (cursor);

  return results;
}

export async function get<T>(path: string): Promise<T> {
  return request<T>(path);
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
