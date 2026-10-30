import { api, euro, type Health, type Product } from "@/lib/api";
import { lookOf } from "@/lib/catalog";
import { Topology } from "@/lib/topology";

export const dynamic = "force-dynamic";

const icon = (d: string) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

export default async function Shop({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ok, error } = await searchParams;
  const [health, products] = await Promise.all([api<Health>("/health"), api<Product[]>("/products")]);
  return (
    <>
      <div className="announce">Kostenloser Versand ab 40 € · Bestellungen vor 14 Uhr gehen heute raus</div>
      <header className="header">
        <div className="wrap">
          <a href="/" className="brand"><span className="brand-mark">K</span>Kontor Sieben</a>
          <nav className="nav">
            <a href="#sortiment">Sortiment</a>
            <a href="#versand">Versand</a>
            <a href="#technik">So läuft der Shop</a>
          </nav>
          <span className="pill">{products.ok ? `${products.data.length} Produkte` : "Sortiment lädt"}</span>
        </div>
      </header>

      <section className="hero">
        <div className="wrap">
          <div>
            <span className="eyebrow">Kaffee · Becher · Papier</span>
            <h1>Gute Dinge für einen ruhigen Arbeitstag.</h1>
            <p>Frisch gerösteter Kaffee, handgemachte Becher und Papier, das gern beschrieben wird. Klein ausgesucht, schnell verschickt.</p>
            <div className="actions">
              <a href="#sortiment" className="btn btn-primary">Zum Sortiment</a>
              <a href="#technik" className="btn btn-ghost">Wie der Shop läuft</a>
            </div>
          </div>
          <div className="hero-art">
            <svg viewBox="0 0 500 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <circle cx="380" cy="90" r="130" fill="rgb(255 255 255 / 0.12)" />
              <circle cx="110" cy="330" r="160" fill="rgb(255 255 255 / 0.08)" />
              <g fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.92">
                <path d="M170 170h150v110a40 40 0 0 1-40 40h-70a40 40 0 0 1-40-40z" />
                <path d="M320 195h18a30 30 0 0 1 0 60h-18" />
                <path d="M205 100c-12 15 12 27 0 42M245 92c-12 15 12 27 0 42M285 100c-12 15 12 27 0 42" />
              </g>
            </svg>
            <div className="hero-badge"><strong>Diese Woche frisch geröstet</strong>Kaffee, 500 g · ab {euro(1290)}</div>
          </div>
        </div>
      </section>

      <section className="trust" id="versand">
        <div className="wrap">
          <div><span className="trust-icon">{icon("M3 7h11v9H3zM14 10h4l3 3v3h-7M7.5 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z")}</span><span><strong>Versand in 1–2 Tagen</strong>Klimaneutral verpackt und verschickt</span></div>
          <div><span className="trust-icon">{icon("M3 12a9 9 0 1 0 3-6.7M3 4v5h5")}</span><span><strong>30 Tage Rückgabe</strong>Ohne Angabe von Gründen</span></div>
          <div><span className="trust-icon">{icon("M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z")}</span><span><strong>Sicher bezahlen</strong>Bequem auf Rechnung</span></div>
        </div>
      </section>

      <section className="section" id="sortiment">
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>Unser Sortiment</h2>
              <p>Alles, was gerade im Lager liegt — der Bestand kommt live aus der Datenbank.</p>
            </div>
          </div>
          {ok && <div className="toast ok">Danke! Bestellung Nr. {ok} ist eingegangen und erscheint sofort im Admin.</div>}
          {error && <div className="toast bad">Das hat nicht geklappt: {error}</div>}
          {!products.ok ? (
            <div className="empty" style={{ marginTop: 24 }}>Das Sortiment ist gerade nicht erreichbar ({products.error}). Bitte gleich noch einmal laden.</div>
          ) : products.data.length === 0 ? (
            <div className="empty" style={{ marginTop: 24 }}>Das Sortiment wird gerade aufgefüllt.</div>
          ) : (
            <div className="products" style={{ marginTop: 24 }}>
              {products.data.map((p) => {
                const look = lookOf(p.name);
                const stock = p.stock < 1 ? "out" : p.stock <= 10 ? "low" : "";
                return (
                  <article className="product" key={p.id}>
                    <div className="product-art" style={{ background: look.tint }}>
                      <span className={`stock ${stock}`}>
                        {p.stock < 1 ? "Ausverkauft" : p.stock <= 10 ? `Nur noch ${p.stock}` : `${p.stock} auf Lager`}
                      </span>
                      {look.art}
                    </div>
                    <div className="product-body">
                      <div className="product-top">
                        <h3>{p.name}</h3>
                        <span className="price">{euro(p.price_cents)}</span>
                      </div>
                      <p>{look.text}</p>
                      <form className="order" action="/api/order" method="post">
                        <input type="hidden" name="product_id" value={p.id} />
                        <input className="field" name="quantity" type="number" min={1} max={Math.max(1, p.stock)} defaultValue={1} aria-label="Menge" />
                        <input className="field" name="customer" placeholder="Ihr Name" required aria-label="Name" />
                        <button className="btn btn-primary" disabled={p.stock < 1}>
                          {p.stock < 1 ? "Ausverkauft" : "Jetzt bestellen"}
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="section" id="technik" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="stack">
            <h2>So läuft dieser Shop</h2>
            <p>Vier Apps in einem Lily-Projekt: Shop und Admin sind öffentlich, API und Datenbank nur im privaten Projektnetz erreichbar. Jede Seite hier fragt live durch die ganze Kette.</p>
            <Topology self="shop" health={health} />
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap">
          <span>© Kontor Sieben · Ein Demo-Shop, Bestellungen werden nicht ausgeliefert.</span>
          <span>Läuft auf Lily</span>
        </div>
      </footer>
    </>
  );
}
