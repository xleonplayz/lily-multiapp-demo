import type { Health, Timed } from "./api";

/** The live path of one request: this app → api → database, with timings. */
export function Topology({ self, health }: { self: string; health: Timed<Health> }) {
  const db = health.ok && health.data.database === "ok";
  return (
    <div className="flow">
      <div className="node">
        <div className="node-head"><i className="dot" />{self}</div>
        <small>Next.js · öffentlich erreichbar</small>
      </div>
      <div className="link"><span>→</span>{health.ms} ms</div>
      <div className="node">
        <div className="node-head"><i className={`dot ${health.ok ? "" : "down"}`} />api</div>
        <small>{health.ok ? `Node · privat · ${health.data.requests} Anfragen` : health.error}</small>
      </div>
      <div className="link"><span>→</span>{health.ok ? `${health.data.database_ms} ms` : "–"}</div>
      <div className="node">
        <div className="node-head"><i className={`dot ${db ? "" : "down"}`} />db</div>
        <small>{health.ok ? `Datenspeicher · privat · ${health.data.records} Datensätze` : "Datenspeicher · privat"}</small>
      </div>
    </div>
  );
}
