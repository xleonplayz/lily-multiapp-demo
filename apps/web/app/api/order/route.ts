import { api } from "@/lib/api";

// The order form posts here; this app forwards it to the private API.
export async function POST(request: Request) {
  const form = await request.formData();
  const result = await api<{ id: number; product: string }>("/orders", {
    method: "POST",
    body: JSON.stringify({
      product_id: Number(form.get("product_id")),
      // An empty quantity field means one piece.
      quantity: Number(form.get("quantity") || 1),
      customer: String(form.get("customer") || ""),
    }),
  });
  // A relative Location: behind the edge, request.url is not the public origin.
  const target = new URLSearchParams();
  if (result.ok) target.set("ok", String(result.data.id));
  else target.set("error", result.error);
  return new Response(null, { status: 303, headers: { location: `/?${target}` } });
}
