import { api, euro, type Health, type Order, type Product, type Stats } from "@/lib/api";
import { Topology } from "@/lib/topology";

export const dynamic = "force-dynamic";

export default async function Admin({ searchParams }: { searchParams: Promise<{ added?: string; error?: string }> }) {
  const { added, error } = await searchParams;
  const [health, stats, orders, products] = await Promise.all([
    api<Health>("/health"), api<Stats>("/stats"), api<Order[]>("/orders"), api<Product[]>("/products"),
  ]);
  return (
    <main>
      <h1>Admin</h1>
      <p className="muted">Verwaltung des Demo-Ladens. Alle Daten kommen über die private API aus der Datenbank.</p>
      <Topology self="admin" health={health} />
      {added && <p className="notice">Produkt „{added}“ angelegt.</p>}
      {error && <p className="notice error">{error}</p>}
      {stats.ok && (
        <div className="grid">
          <div className="card"><div className="muted">Bestellungen</div><h2>{stats.data.orders}</h2></div>
          <div className="card"><div className="muted">Umsatz</div><h2>{euro(stats.data.revenue_cents)}</h2></div>
          <div className="card"><div className="muted">Produkte</div><h2>{stats.data.products}</h2></div>
          {health.ok && <div className="card"><div className="muted">API-Laufzeit</div><h2>{health.data.uptime_s} s</h2></div>}
        </div>
      )}
      <h2>Neue Bestellungen</h2>
      {orders.ok ? (
        <table>
          <thead><tr><th>#</th><th>Kunde</th><th>Produkt</th><th>Menge</th><th>Summe</th><th>Zeit</th></tr></thead>
          <tbody>
            {orders.data.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td><td>{o.customer}</td><td>{o.product}</td><td>{o.quantity}</td>
                <td>{euro(o.total_cents)}</td><td>{new Date(o.created_at).toLocaleString("de-DE")}</td>
              </tr>
            ))}
            {orders.data.length === 0 && <tr><td colSpan={6} className="muted">Noch keine Bestellungen.</td></tr>}
          </tbody>
        </table>
      ) : <p className="notice error">{orders.error}</p>}
      <h2>Produkte</h2>
      {products.ok && (
        <table>
          <thead><tr><th>Name</th><th>Preis</th><th>Lager</th></tr></thead>
          <tbody>{products.data.map((p) => <tr key={p.id}><td>{p.name}</td><td>{euro(p.price_cents)}</td><td>{p.stock}</td></tr>)}</tbody>
        </table>
      )}
      <form action="/api/product" method="post">
        <input name="name" placeholder="Neues Produkt" required />
        <input name="price" type="number" step="0.01" min="0" placeholder="Preis in €" required style={{ width: 120 }} />
        <input name="stock" type="number" min="0" placeholder="Lager" style={{ width: 90 }} />
        <button>Anlegen</button>
      </form>
    </main>
  );
}
