import type { InsightsTeamRow } from "../../data/insights";
import { formatInsightsPercent } from "../../data/insights";
import { money } from "../../data/shift";

export function BestPerformanceCard({ row }: { row: InsightsTeamRow }) {
  return (
    <article className="who-converts-card" aria-labelledby="best-performance-heading">
      <p className="who-converts-eyebrow">Team performance</p>
      <h3 id="best-performance-heading" className="who-converts-title">
        Best performance
      </h3>

      <div className="who-converts-highlight">
        <span className="who-converts-segment">{row.receptionist}</span>
        <span className="who-converts-rate">{money.format(row.revenue)}</span>
        <span className="who-converts-rate-label">revenue</span>
      </div>

      <div className="who-converts-stats">
        <div className="who-converts-stat">
          <span className="who-converts-stat-label">Conversion</span>
          <span className="who-converts-stat-value">{formatInsightsPercent(row.conversion)}</span>
        </div>
        <div className="who-converts-stat">
          <span className="who-converts-stat-label">Avg. sale</span>
          <span className="who-converts-stat-value">{money.format(row.avgSale)}</span>
        </div>
      </div>
    </article>
  );
}
