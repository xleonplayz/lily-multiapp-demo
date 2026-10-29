import { api, euro, type Health, type Product } from "@/lib/api";
import { Topology } from "@/lib/topology";

export const dynamic = "force-dynamic";

export default async function Shop({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ok, error } = await searchParams;
  const [health, products] = await Promise.all([api<Health>("/health"), api<Product[]>("/products")]);
  return (
    <main>
      <h1>Demo-Laden</h1>
      <p className="muted">Ein Shop aus drei Apps und einer Datenbank, verbunden über das Projekt-Netzwerk.</p>
      <Topology self="web" health={health} />
      {ok && <p className="notice">Bestellung {ok} ist eingegangen. Sie erscheint sofort im Admin.</p>}
      {error && <p className="notice error">{error}</p>}
      <h2>Produkte</h2>
      {!products.ok ? (
        <p className="notice error">Die API antwortet nicht: {products.error}</p>
      ) : (
        <div className="grid">
          {products.data.map((p) => (
            <div className="card" key={p.id}>
              <strong>{p.name}</strong>
              <div>{euro(p.price_cents)}</div>
              <div className="muted">{p.stock} auf Lager</div>
              <form action="/api/order" method="post">
                <input type="hidden" name="product_id" value={p.id} />
                <input name="quantity" type="number" min={1} max={p.stock} defaultValue={1} style={{ width: 70 }} />
                <input name="customer" placeholder="Name" required style={{ width: 110 }} />
                <button disabled={p.stock < 1}>Bestellen</button>
              </form>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
