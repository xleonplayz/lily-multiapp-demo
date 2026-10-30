// The shop's database: a small record store on its own volume. Only the API
// reaches it, over the project network. Every write is appended to a log on
// disk before it is answered, and the log is replayed on start.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.env.PORT || 7000);
const DIR = process.env.DATA_DIR || "/data";
const LOG = path.join(DIR, "records.log");
const tables = new Map(); // table -> Map(id -> record)
const counters = new Map(); // table -> last id
let writes = 0;

function table(name) {
  if (!tables.has(name)) tables.set(name, new Map());
  return tables.get(name);
}

function apply(entry) {
  const rows = table(entry.table);
  if (entry.op === "put") {
    rows.set(entry.record.id, entry.record);
    counters.set(entry.table, Math.max(counters.get(entry.table) || 0, entry.record.id));
  }
}

function append(entry) {
  fs.appendFileSync(LOG, JSON.stringify(entry) + "\n");
  apply(entry);
  writes += 1;
}

fs.mkdirSync(DIR, { recursive: true });
if (fs.existsSync(LOG)) {
  for (const line of fs.readFileSync(LOG, "utf8").split("\n")) {
    if (line) apply(JSON.parse(line));
  }
}

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

// GET    /health
// GET    /t/<table>              all records, by id
// POST   /t/<table>              insert, answers the record with its id
// POST   /t/<table>/<id>/take    {field, amount}: subtract if enough is left
http.createServer(async (req, res) => {
  try {
    const parts = new URL(req.url, "http://db").pathname.split("/").filter(Boolean);
    if (req.method === "GET" && parts[0] === "health") {
      const records = [...tables.values()].reduce((n, rows) => n + rows.size, 0);
      return send(res, 200, { service: "db", records, writes });
    }
    if (parts[0] !== "t" || !parts[1]) return send(res, 404, { error: "not found" });
    const name = parts[1];
    if (req.method === "GET" && parts.length === 2) {
      return send(res, 200, [...table(name).values()].sort((a, b) => a.id - b.id));
    }
    if (req.method === "POST" && parts.length === 2) {
      const id = (counters.get(name) || 0) + 1;
      const record = { ...(await readJson(req)), id, created_at: new Date().toISOString() };
      append({ op: "put", table: name, record });
      return send(res, 201, record);
    }
    if (req.method === "POST" && parts.length === 4 && parts[3] === "take") {
      const { field, amount } = await readJson(req);
      const current = table(name).get(Number(parts[2]));
      if (!current) return send(res, 404, { error: "no such record" });
      if (!(Number(current[field]) >= amount)) return send(res, 409, { error: `not enough ${field}` });
      const record = { ...current, [field]: Number(current[field]) - amount };
      append({ op: "put", table: name, record });
      return send(res, 200, record);
    }
    send(res, 405, { error: "method not allowed" });
  } catch (error) {
    send(res, 500, { error: error.message });
  }
}).listen(PORT, () => console.log(`db listening on ${PORT}, data in ${DIR}`));
