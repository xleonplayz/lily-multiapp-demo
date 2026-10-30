// The backend's address inside the project network, e.g. http://<api app>:4000.
// Set API_URL on this app; the API itself has no public address.
const base = () => (process.env.API_URL || "http://api:4000").replace(/\/$/, "");

export type Timed<T> = { ok: true; data: T; ms: number } | { ok: false; error: string; ms: number };

export async function api<T>(path: string, init?: RequestInit): Promise<Timed<T>> {
  const t0 = Date.now();
  try {
    const res = await fetch(base() + path, { ...init, cache: "no-store",
      headers: { "content-type": "application/json", ...(init?.headers || {}) } });
    const body = await res.json();
    if (!res.ok) return { ok: false, error: body?.error || `HTTP ${res.status}`, ms: Date.now() - t0 };
    return { ok: true, data: body as T, ms: Date.now() - t0 };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error), ms: Date.now() - t0 };
  }
}

export type Health = { service: string; database: string; database_ms: number; records: number; uptime_s: number; requests: number };
export type Product = { id: number; name: string; price_cents: number; stock: number };
export type Order = { id: number; quantity: number; customer: string; created_at: string; product: string; total_cents: number };
export type Stats = { products: number; orders: number; revenue_cents: number };

export const euro = (cents: number) => (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
