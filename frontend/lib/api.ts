const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone_number: string;
}

export interface AuthData {
  access_token: string;
  refresh_token?: string;
  verification_required?: boolean;
  user: User;
}

interface ApiEnvelope<T> {
  success?: boolean;
  status?: string;
  data?: T;
  message?: string;
  error?: string;
  details?: Array<{ path?: string; message?: string }>;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export function getSession(): AuthData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("askclo_session");
  try { return raw ? JSON.parse(raw) as AuthData : null; } catch { return null; }
}

export function setSession(session: AuthData | null) {
  if (session) localStorage.setItem("askclo_session", JSON.stringify(session));
  else localStorage.removeItem("askclo_session");
}

async function rawRequest<T>(path: string, init: RequestInit, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => ({})) as ApiEnvelope<T>;
  if (!response.ok || body.success === false || body.status === "error") {
    const detail = body.details?.[0]?.message;
    throw new ApiError(detail ?? body.error ?? body.message ?? "Something went wrong", response.status);
  }
  return body.data as T;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let session = getSession();
  try {
    return await rawRequest<T>(path, init, session?.access_token);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || !session?.refresh_token) throw error;
    const refreshed = await rawRequest<AuthData>("/auth/refresh", {
      method: "POST", body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    session = refreshed;
    setSession(refreshed);
    return rawRequest<T>(path, init, refreshed.access_token);
  }
}

export { API_URL };
