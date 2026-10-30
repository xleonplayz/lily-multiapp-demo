# Demo-Laden: four apps on one project network

A small shop built from separate apps that run on their own and talk to each
other over a private project network. It shows what a multi-app project looks
like on Lily.

| App | Path | What it is | Reachable |
|---|---|---|---|
| `web` | `apps/web/` | The shop: Next.js, lists products, takes orders | public |
| `admin` | `apps/admin/` | The back office: Next.js, orders, revenue, new products | public |
| `api` | `services/api/` | The backend: Node HTTP server, the only app with database access | private, port 4000 |
| `db` | `services/db/` | The database: a small record store, writes appended to a log on its own volume | private, port 7000 |

```
 browser ──► web  ──┐
                    ├──► api :4000 ──► db :7000
 browser ──► admin ─┘
```

Both front ends show the live path of a request (app → api → db) with the
time each hop took, so a broken link is visible at once.

## Configuration

| App | Variable | Value |
|---|---|---|
| `web`, `admin` | `API_URL` | `http://<api app>:4000` |
| `api` | `DB_URL` | `http://<db app>:7000` |
| `api` | `PORT` | `4000` |
| `db` | `DATA_DIR` | the mounted volume, e.g. `/data` |
| `db` | `PORT` | `7000` |

Network edges: `web → api:4000`, `admin → api:4000`, `api → db:7000`.
Only `web` and `admin` are exposed; `db` keeps its data on a volume.

The API adds four sample products on first start. The database keeps every
record in memory, appends each write to `records.log` before answering, and
replays the log when it starts, so data survives a restart.

## Running it without Lily

```
(cd services/db && DATA_DIR=./data node server.js)
(cd services/api && DB_URL=http://localhost:7000 node server.js)
(cd apps/web && npm ci && API_URL=http://localhost:4000 npx next dev -p 3000)
(cd apps/admin && npm ci && API_URL=http://localhost:4000 npx next dev -p 3001)
```
