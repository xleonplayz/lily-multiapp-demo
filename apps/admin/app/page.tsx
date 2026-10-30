import { api, euro, type Health, type Order, type Product, type Stats } from "@/lib/api";

export const dynamic = "force-dynamic";

const icon = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const ICONS = {
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  orders: "M6 2h12l2 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zM4 6h16M9 11h6M9 15h6",
  box: "M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10",
  pulse: "M3 12h4l3-8 4 16 3-8h4",
  euro: "M17 6a7 7 0 1 0 0 12M4 10h9M4 14h9",
  cart: "M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6",
  avg: "M4 19V5M4 19h16M8 15l4-4 3 3 5-6",
  alert: "M12 3l10 18H2zM12 10v4M12 17.5v.5",
};

const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#14b8a6"];
const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
const color = (name: string) => COLORS[[...name].reduce((h, c) => h + c.charCodeAt(0), 0) % COLORS.length];
const ago = (iso: string) => {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "gerade eben";
  if (s < 3600) return `vor ${Math.round(s / 60)} Min.`;
  if (s < 86400) return `vor ${Math.round(s / 3600)} Std.`;
  return new Date(iso).toLocaleDateString("de-DE");
};
const uptime = (s: number) => (s < 3600 ? `${Math.round(s / 60)} Min.` : s < 86400 ? `${(s / 3600).toFixed(1)} Std.` : `${(s / 86400).toFixed(1)} Tage`);

export default async function Admin({ searchParams }: { searchParams: Promise<{ added?: string; error?: string }> }) {
  const { added, error } = await searchParams;
  const [health, stats, orders, products] = await Promise.all([
    api<Health>("/health"), api<Stats>("/stats"), api<Order[]>("/orders"), api<Product[]>("/products"),
  ]);
  const up = health.ok && health.data.database === "ok";
  const low = products.ok ? products.data.filter((p) => p.stock <= 10).length : 0;
  const maxStock = products.ok ? Math.max(1, ...products.data.map((p) => p.stock)) : 1;
  const average = stats.ok && stats.data.orders > 0 ? stats.data.revenue_cents / stats.data.orders : 0;

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><span className="brand-mark">K</span><span>Kontor Sieben<small>Admin</small></span></div>
        <nav className="menu">
          <a className="active" href="#">{icon(ICONS.home)}Übersicht</a>
          <a href="#bestellungen">{icon(ICONS.orders)}Bestellungen</a>
          <a href="#produkte">{icon(ICONS.box)}Produkte</a>
          <a href="#system">{icon(ICONS.pulse)}System</a>
        </nav>
        <div className="side-foot">Demo auf Lily · Daten live aus der privaten Datenbank</div>
      </aside>

      <main className="main">
        <div className="top">
          <div>
            <h1>Übersicht</h1>
            <p>{new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}</p>
          </div>
          <span className="status"><i className={`dot ${up ? "" : "down"}`} />{up ? "Alle Dienste erreichbar" : "Dienst gestört"}</span>
        </div>

        {added && <div className="toast ok">Produkt „{added}“ wurde angelegt und ist sofort im Shop.</div>}
        {error && <div className="toast bad">{error}</div>}

        <section className="kpis">
          <div className="kpi">
            <div className="kpi-head">Umsatz<span className="kpi-icon">{icon(ICONS.euro)}</span></div>
            <div className="kpi-value">{stats.ok ? euro(stats.data.revenue_cents) : "–"}</div>
            <div className="kpi-note">alle Bestellungen</div>
          </div>
          <div className="kpi">
            <div className="kpi-head">Bestellungen<span className="kpi-icon">{icon(ICONS.cart)}</span></div>
            <div className="kpi-value">{stats.ok ? stats.data.orders : "–"}</div>
            <div className="kpi-note">seit Start der Datenbank</div>
          </div>
          <div className="kpi">
            <div className="kpi-head">Ø Bestellwert<span className="kpi-icon">{icon(ICONS.avg)}</span></div>
            <div className="kpi-value">{stats.ok ? euro(average) : "–"}</div>
            <div className="kpi-note">pro Bestellung</div>
          </div>
          <div className="kpi">
            <div className="kpi-head">Niedriger Bestand<span className="kpi-icon">{icon(ICONS.alert)}</span></div>
            <div className="kpi-value">{products.ok ? low : "–"}</div>
            <div className="kpi-note">von {products.ok ? products.data.length : "–"} Produkten ≤ 10 Stück</div>
          </div>
        </section>

        <div className="grid2">
          <div>
            <section className="panel" id="bestellungen">
              <div className="panel-head"><h2>Neueste Bestellungen</h2><span>{orders.ok ? `${orders.data.length} angezeigt` : ""}</span></div>
              {!orders.ok ? (
                <div className="empty">Bestellungen nicht erreichbar: {orders.error}</div>
              ) : orders.data.length === 0 ? (
                <div className="empty">Noch keine Bestellungen. Bestellen Sie im Shop, sie erscheinen hier sofort.</div>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Kunde</th><th>Produkt</th><th className="num">Menge</th><th className="num">Summe</th><th>Eingang</th></tr></thead>
                    <tbody>
                      {orders.data.map((o) => (
                        <tr key={o.id}>
                          <td><span className="who"><span className="avatar" style={{ background: color(o.customer) }}>{initials(o.customer)}</span>{o.customer}</span></td>
                          <td>{o.product}<div className="muted">Nr. {o.id}</div></td>
                          <td className="num">{o.quantity}</td>
                          <td className="num"><strong>{euro(o.total_cents)}</strong></td>
                          <td className="muted">{ago(o.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="panel" id="produkte">
              <div className="panel-head"><h2>Produkte & Bestand</h2><span>{products.ok ? `${products.data.length} Artikel` : ""}</span></div>
              {products.ok ? (
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Produkt</th><th className="num">Preis</th><th>Bestand</th><th>Status</th></tr></thead>
                    <tbody>
                      {products.data.map((p) => (
                        <tr key={p.id}>
                          <td><strong>{p.name}</strong></td>
                          <td className="num">{euro(p.price_cents)}</td>
                          <td><span className="bar"><i style={{ width: `${Math.round((p.stock / maxStock) * 100)}%` }} /></span>{p.stock}</td>
                          <td>
                            {p.stock < 1 ? <span className="badge bad">Ausverkauft</span>
                              : p.stock <= 10 ? <span className="badge warn">Nachbestellen</span>
                              : <span className="badge ok">Verfügbar</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="empty">Produkte nicht erreichbar: {products.error}</div>}
            </section>
          </div>

          <div>
            <section className="panel">
              <div className="panel-head"><h2>Neues Produkt</h2></div>
              <div className="panel-body">
                <form className="form" action="/api/product" method="post">
                  <label>Name<input className="field" name="name" placeholder="z. B. Espressotasse" required /></label>
                  <div className="row">
                    <label>Preis (€)<input className="field" name="price" type="number" step="0.01" min="0" placeholder="9,90" required /></label>
                    <label>Bestand<input className="field" name="stock" type="number" min="0" placeholder="20" /></label>
                  </div>
                  <button className="btn">Produkt anlegen</button>
                </form>
              </div>
            </section>

            <section className="panel" id="system">
              <div className="panel-head"><h2>System</h2><span>live gemessen</span></div>
              <div className="panel-body chain">
                <div className="hop">
                  <div><strong><i className="dot" />admin</strong><small>Next.js · öffentlich</small></div>
                  <span className="latency">{health.ms} ms</span>
                </div>
                <div className="hop">
                  <div><strong><i className={`dot ${health.ok ? "" : "down"}`} />api</strong><small>{health.ok ? `Node · privat · läuft seit ${uptime(health.data.uptime_s)}` : health.error}</small></div>
                  <span className="latency">{health.ok ? `${health.data.requests} Anfr.` : "–"}</span>
                </div>
                <div className="hop">
                  <div><strong><i className={`dot ${up ? "" : "down"}`} />db</strong><small>{health.ok ? `Datenspeicher · privat · ${health.data.records} Datensätze` : "Datenspeicher · privat"}</small></div>
                  <span className="latency">{health.ok ? `${health.data.database_ms} ms` : "–"}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
