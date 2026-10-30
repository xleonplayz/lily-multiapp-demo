import type { Health, Timed } from "./api";

/** The live path of one request: this app → api → database, with timings. */
export function Topology({ self, health }: { self: string; health: Timed<Health> }) {
  const node = (label: string, ok: boolean, detail: string) => (
    <div className={`node ${ok ? "up" : "down"}`}>
      <strong>{label}</strong>
      <span>{detail}</span>
    </div>
  );
  return (
    <div className="topology">
      {node(self, true, "Next.js, öffentlich")}
      <div className="edge">→ {health.ms} ms</div>
      {node("api", health.ok, health.ok ? `Node, privat · ${health.data.requests} Anfragen` : health.error)}
      <div className="edge">→ {health.ok ? `${health.data.database_ms} ms` : "?"}</div>
      {node("db", health.ok && health.data.database === "ok", health.ok ? `Datenspeicher, privat · ${health.data.records} Datensätze` : "Datenspeicher, privat")}
    </div>
  );
}
