# Demo-Laden: four apps on one project network

A small shop built from separate apps that run on their own and talk to each
other over a private project network. It shows what a multi-app project looks
like on Lily.

| App | Path | What it is | Reachable |
|---|---|---|---|
| `web` | `web/` | The shop: Next.js, lists products, takes orders | public |
| `admin` | `admin/` | The back office: Next.js, orders, revenue, new products | public |
| `api` | `api/` | The backend: Node HTTP server, the only app with database access | private, port 4000 |
| `db` | separate source | PostgreSQL | private, port 5432 |

```
 browser ──► web  ──┐
                    ├──► api :4000 ──► db :5432
 browser ──► admin ─┘
```

Both front ends show the live path of a request (app → api → db) with the
time each hop took, so a broken link is visible at once.

## Configuration

| App | Variable | Value |
|---|---|---|
| `web`, `admin` | `API_URL` | `http://<api app>:4000` |
| `api` | `DATABASE_URL` | `postgresql://postgres@<db app>:5432/shop` |
| `api` | `PORT` | `4000` |

Network edges: `web → api:4000`, `admin → api:4000`, `api → db:5432`.
Only `web` and `admin` are exposed.

The API creates its tables and four sample products on first start. The
database here serves one connection at a time, so the API sends its queries
over one connection in order.

## Running it without Lily

```
docker run -d -p 5432:5432 -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=shop postgres:16
(cd api && npm ci && DATABASE_URL=postgresql://postgres@localhost:5432/shop node server.js)
(cd web && npm ci && API_URL=http://localhost:4000 npx next dev -p 3000)
(cd admin && npm ci && API_URL=http://localhost:4000 npx next dev -p 3001)
```
