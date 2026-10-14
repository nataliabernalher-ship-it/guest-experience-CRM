import type { InsightsAutomationRow } from "../../data/insights";
import { formatInsightsPercent } from "../../data/insights";
import { money } from "../../data/shift";

export function TopAutomationsTable({ rows }: { rows: InsightsAutomationRow[] }) {
  return (
    <div className="insights-table-wrap">
      <table className="listing-table insights-table">
        <thead>
          <tr>
            <th>Automation</th>
            <th>Opportunities</th>
            <th>Conversion</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.automation}>
              <td className="cell-action">{row.automation}</td>
              <td>{row.opportunities}</td>
              <td>{formatInsightsPercent(row.conversion)}</td>
              <td>{money.format(row.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
