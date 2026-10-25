const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export type User = { id: string; email: string; role: "USER" | "ADMIN" };
export type Vehicle = {
  id: string; make: string; model: string; category: string;
  price: number; quantity: number;
};
type AuthResponse = { token: string; user: User };

let token = localStorage.getItem("dealer-token") ?? "";
export function setToken(value: string) {
  token = value;
  if (value) localStorage.setItem("dealer-token", value);
  else localStorage.removeItem("dealer-token");
}
export function getToken() { return token; }

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  auth: (mode: "login" | "register", email: string, password: string) =>
    request<AuthResponse>(`/auth/${mode}`, { method: "POST", body: JSON.stringify({ email, password }) }),
  vehicles: () => request<Vehicle[]>("/vehicles"),
  search: (filters: Record<string, string>) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value.trim()) params.set(key, value); });
    return request<Vehicle[]>(`/vehicles/search?${params.toString()}`);
  },
  create: (input: Omit<Vehicle, "id">) =>
    request<Vehicle>("/vehicles", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: Partial<Omit<Vehicle, "id">>) =>
    request<Vehicle>(`/vehicles/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  remove: (id: string) => request<void>(`/vehicles/${id}`, { method: "DELETE" }),
  purchase: (id: string) =>
    request<Vehicle>(`/vehicles/${id}/purchase`, { method: "POST", body: JSON.stringify({ quantity: 1 }) }),
  restock: (id: string, quantity: number) =>
    request<Vehicle>(`/vehicles/${id}/restock`, { method: "POST", body: JSON.stringify({ quantity }) })
};
