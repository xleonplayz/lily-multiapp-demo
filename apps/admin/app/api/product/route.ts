import { api } from "@/lib/api";

// The product form posts here; this app forwards it to the private API.
export async function POST(request: Request) {
  const form = await request.formData();
  const name = String(form.get("name") || "");
  const result = await api<{ id: number }>("/products", {
    method: "POST",
    body: JSON.stringify({
      name,
      price_cents: Math.round(Number(form.get("price")) * 100),
      stock: Number(form.get("stock") || 0),
    }),
  });
  // A relative Location: behind the edge, request.url is not the public origin.
  const target = new URLSearchParams();
  if (result.ok) target.set("added", name);
  else target.set("error", result.error);
  return new Response(null, { status: 303, headers: { location: `/?${target}` } });
}
