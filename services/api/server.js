// The shop's backend: the only app that talks to the database. The web shop
// and the admin reach it over the project network; it has no public address.
import http from "node:http";
import pg from "pg";

const PORT = Number(process.env.PORT || 4000);
const started = Date.now();
let requests = 0;

// The database serves one connection at a time, so all queries share one
// client and run in order.
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
let queue = Promise.resolve();
const query = (text, params) => {
  const next = queue.then(() => db.query(text, params));
  queue = next.catch(() => {});
  return next;
};

let ready = (async () => {
  await db.connect();
  await query(`CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY, name TEXT NOT NULL, price_cents INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  await query(`CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL, customer TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  const { rows } = await query("SELECT count(*)::int AS n FROM products");
  if (rows[0].n === 0) {
    for (const [name, price, stock] of [
      ["Kaffee, 500 g", 1290, 40],
      ["Teebecher", 890, 25],
      ["Notizbuch A5", 650, 60],
      ["Stoffbeutel", 450, 80],
    ]) {
      await query("INSERT INTO products (name, price_cents, stock) VALUES ($1, $2, $3)", [name, price, stock]);
    }
  }
})();
ready.catch((error) => console.error("database setup failed:", error.message));

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
    await query("SELECT 1");
    return [200, { service: "api", database: "ok", database_ms: Date.now() - t0,
      uptime_s: Math.round((Date.now() - started) / 1000), requests }];
  },
  "GET /products": async () => {
    const { rows } = await query("SELECT id, name, price_cents, stock FROM products ORDER BY id");
    return [200, rows];
  },
  "POST /products": async (req) => {
    const { name, price_cents, stock } = await readJson(req);
    if (!name || !Number.isInteger(price_cents) || price_cents < 0) return [400, { error: "name and price_cents required" }];
    const { rows } = await query(
      "INSERT INTO products (name, price_cents, stock) VALUES ($1, $2, $3) RETURNING id, name, price_cents, stock",
      [name, price_cents, Number.isInteger(stock) ? stock : 0]);
    return [201, rows[0]];
  },
  "GET /orders": async () => {
    const { rows } = await query(`SELECT o.id, o.quantity, o.customer, o.created_at, p.name AS product,
      o.quantity * p.price_cents AS total_cents FROM orders o JOIN products p ON p.id = o.product_id
      ORDER BY o.id DESC LIMIT 50`);
    return [200, rows];
  },
  "POST /orders": async (req) => {
    const { product_id, quantity, customer } = await readJson(req);
    const amount = Number(quantity);
    if (!Number.isInteger(amount) || amount < 1 || !customer) return [400, { error: "product_id, quantity and customer required" }];
    const { rows } = await query("UPDATE products SET stock = stock - $2 WHERE id = $1 AND stock >= $2 RETURNING name",
      [Number(product_id), amount]);
    if (rows.length === 0) return [409, { error: "not enough stock" }];
    const order = await query("INSERT INTO orders (product_id, quantity, customer) VALUES ($1, $2, $3) RETURNING id",
      [Number(product_id), amount, String(customer).slice(0, 80)]);
    return [201, { id: order.rows[0].id, product: rows[0].name }];
  },
  "GET /stats": async () => {
    const { rows } = await query(`SELECT
      (SELECT count(*)::int FROM products) AS products,
      (SELECT count(*)::int FROM orders) AS orders,
      (SELECT coalesce(sum(o.quantity * p.price_cents), 0)::int FROM orders o JOIN products p ON p.id = o.product_id) AS revenue_cents`);
    return [200, rows[0]];
  },
};

http.createServer(async (req, res) => {
  requests += 1;
  const route = routes[`${req.method} ${new URL(req.url, "http://api").pathname}`];
  if (!route) return send(res, 404, { error: "not found" });
  try {
    await ready;
    const [status, body] = await route(req);
    send(res, status, body);
  } catch (error) {
    send(res, 500, { error: error.message });
  }
}).listen(PORT, () => console.log(`api listening on ${PORT}`));
