// The shop's backend: the only app that talks to the database. The web shop
// and the admin reach it over the project network; it has no public address.
import http from "node:http";

const PORT = Number(process.env.PORT || 4000);
const DB = (process.env.DB_URL || "http://db:7000").replace(/\/$/, "");
const started = Date.now();
let requests = 0;

async function db(path, init) {
  const res = await fetch(DB + path, { ...init, headers: { "content-type": "application/json" } });
  const body = await res.json();
  if (!res.ok) {
    const error = new Error(body.error || `database answered ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return body;
}

// The database may start empty again (a restart without a volume), so the
// catalog is checked every 30 s and refilled when it is empty.
let checkedAt = 0;
let seeding = null;
async function ensureSeeded() {
  if (Date.now() - checkedAt < 30_000) return;
  seeding ??= (async () => {
    const products = await db("/t/products");
    if (products.length === 0) {
      for (const [name, price_cents, stock] of [
        ["Kaffee, 500 g", 1290, 40],
        ["Teebecher", 890, 25],
        ["Notizbuch A5", 650, 60],
        ["Stoffbeutel", 450, 80],
      ]) {
        await db("/t/products", { method: "POST", body: JSON.stringify({ name, price_cents, stock }) });
      }
    }
    checkedAt = Date.now();
  })().finally(() => {
    seeding = null;
  });
  await seeding;
}
ensureSeeded().catch((error) => console.error("seeding failed:", error.message));

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

const routes = {
  "GET /health": async () => {
    const t0 = Date.now();
    const database = await db("/health");
    return [200, { service: "api", database: "ok", database_ms: Date.now() - t0, records: database.records,
      uptime_s: Math.round((Date.now() - started) / 1000), requests }];
  },
  "GET /products": async () => [200, await db("/t/products")],
  "POST /products": async (req) => {
    const { name, price_cents, stock } = await readJson(req);
    if (!name || !Number.isInteger(price_cents) || price_cents < 0) return [400, { error: "name and price_cents required" }];
    const product = await db("/t/products", { method: "POST",
      body: JSON.stringify({ name, price_cents, stock: Number.isInteger(stock) ? stock : 0 }) });
    return [201, product];
  },
  "GET /orders": async () => {
    const [orders, products] = await Promise.all([db("/t/orders"), db("/t/products")]);
    const byId = new Map(products.map((p) => [p.id, p]));
    return [200, orders.reverse().slice(0, 50).map((o) => ({
      id: o.id, quantity: o.quantity, customer: o.customer, created_at: o.created_at,
      product: byId.get(o.product_id)?.name ?? "?",
      total_cents: o.quantity * (byId.get(o.product_id)?.price_cents ?? 0),
    }))];
  },
  "POST /orders": async (req) => {
    const { product_id, quantity, customer } = await readJson(req);
    // A shop form left empty (or an old one sending 0) orders one piece.
    const amount = Number(quantity) || 1;
    if (!Number.isInteger(amount) || amount < 1 || !customer) return [400, { error: "Bitte Namen und eine Menge angeben." }];
    try {
      const product = await db(`/t/products/${Number(product_id)}/take`, { method: "POST",
        body: JSON.stringify({ field: "stock", amount }) });
      const order = await db("/t/orders", { method: "POST",
        body: JSON.stringify({ product_id: product.id, quantity: amount, customer: String(customer).slice(0, 80) }) });
      return [201, { id: order.id, product: product.name }];
    } catch (error) {
      if (error.status === 409) return [409, { error: "not enough stock" }];
      throw error;
    }
  },
  "GET /stats": async () => {
    const [orders, products] = await Promise.all([db("/t/orders"), db("/t/products")]);
    const byId = new Map(products.map((p) => [p.id, p]));
    const revenue_cents = orders.reduce((sum, o) => sum + o.quantity * (byId.get(o.product_id)?.price_cents ?? 0), 0);
    return [200, { products: products.length, orders: orders.length, revenue_cents }];
  },
};

http.createServer(async (req, res) => {
  requests += 1;
  const route = routes[`${req.method} ${new URL(req.url, "http://api").pathname}`];
  if (!route) return send(res, 404, { error: "not found" });
  try {
    await ensureSeeded();
    const [status, body] = await route(req);
    send(res, status, body);
  } catch (error) {
    send(res, 502, { error: error.message });
  }
}).listen(PORT, () => console.log(`api listening on ${PORT}, database at ${DB}`));
