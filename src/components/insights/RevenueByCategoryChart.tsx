import type { InsightsCategoryRow } from "../../data/insights";
import { money } from "../../data/shift";

export function RevenueByCategoryChart({ rows }: { rows: InsightsCategoryRow[] }) {
  const max = Math.max(...rows.map((row) => row.revenue), 1);

  return (
    <ul className="insights-category-bars" aria-label="Revenue by category">
      {rows.map((row) => (
        <li key={row.name} className="insights-category-row">
          <div className="insights-category-meta">
            <span className="insights-category-name">{row.name}</span>
            <span className="insights-category-amount">{money.format(row.revenue)}</span>
          </div>
          <div className="insights-category-track" aria-hidden="true">
            <span
              className="insights-category-fill"
              style={{ width: `${Math.max((row.revenue / max) * 100, 4)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
