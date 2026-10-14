import type { InsightsKpi } from "../../data/insights";

export function InsightsKpiCards({ kpis }: { kpis: InsightsKpi[] }) {
  return (
    <div className="insights-kpi-grid" data-testid="insights-kpis">
      {kpis.map((kpi) => (
        <article key={kpi.id} className="insights-kpi-card table-card">
          <p className="insights-kpi-label">{kpi.label}</p>
          <p className="insights-kpi-value">{kpi.value}</p>
          <p className={kpi.positive ? "insights-kpi-delta is-up" : "insights-kpi-delta is-down"}>
            {kpi.delta}
          </p>
        </article>
      ))}
    </div>
  );
}
