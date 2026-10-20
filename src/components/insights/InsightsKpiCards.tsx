import type { InsightsKpi } from "../../data/insights";

export function InsightsKpiCards({ kpis }: { kpis: InsightsKpi[] }) {
  return (
    <article className="who-converts-card insights-kpi-panel" data-testid="insights-kpis">
      <h3 className="who-converts-title">Key metrics</h3>

      <div className="insights-kpi-metrics">
        {kpis.map((kpi) => (
          <div key={kpi.id} className="insights-kpi-metric">
            <span className="insights-kpi-metric-label">{kpi.label}</span>
            <span className="insights-kpi-metric-value">{kpi.value}</span>
            <span
              className={
                kpi.positive ? "insights-kpi-metric-delta is-up" : "insights-kpi-metric-delta is-down"
              }
            >
              {kpi.delta}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}
