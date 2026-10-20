import type { InsightsGuestSegmentRow } from "../../data/insights";
import { formatInsightsPercent } from "../../data/insights";
import { money } from "../../data/shift";

export function WhoConvertsCard({ row }: { row: InsightsGuestSegmentRow }) {
  return (
    <article className="who-converts-card" aria-labelledby="who-converts-heading">
      <p className="who-converts-eyebrow">Guest insights</p>
      <h3 id="who-converts-heading" className="who-converts-title">
        Who converts?
      </h3>

      <div className="who-converts-highlight">
        <span className="who-converts-segment">{row.segment}</span>
        <span className="who-converts-rate">{formatInsightsPercent(row.conversion)}</span>
        <span className="who-converts-rate-label">conversion</span>
      </div>

      <div className="who-converts-stats">
        <div className="who-converts-stat">
          <span className="who-converts-stat-label">Revenue</span>
          <span className="who-converts-stat-value">{money.format(row.revenue)}</span>
        </div>
        <div className="who-converts-stat">
          <span className="who-converts-stat-label">Top service</span>
          <span className="who-converts-stat-value">{row.topService}</span>
        </div>
      </div>
    </article>
  );
}
