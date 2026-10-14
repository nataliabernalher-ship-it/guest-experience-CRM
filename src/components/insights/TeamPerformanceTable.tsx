import { useMemo, useState } from "react";
import type { InsightsTeamRow } from "../../data/insights";
import { formatInsightsPercent } from "../../data/insights";
import { money } from "../../data/shift";

type TeamSortKey = "opportunities" | "sales" | "conversion" | "revenue";
type SortDir = "asc" | "desc";

function nextSort(currentKey: TeamSortKey, currentDir: SortDir, clicked: TeamSortKey): {
  key: TeamSortKey;
  dir: SortDir;
} {
  if (currentKey === clicked) {
    return { key: clicked, dir: currentDir === "asc" ? "desc" : "asc" };
  }
  return { key: clicked, dir: "desc" };
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: TeamSortKey;
  activeKey: TeamSortKey;
  direction: SortDir;
  onSort: (key: TeamSortKey) => void;
}) {
  const active = activeKey === sortKey;
  return (
    <th>
      <button type="button" className="insights-sort-btn" onClick={() => onSort(sortKey)}>
        {label}
        <span className="insights-sort-mark" aria-hidden="true">
          {active ? (direction === "asc" ? "↑" : "↓") : ""}
        </span>
      </button>
    </th>
  );
}

export function TeamPerformanceTable({ rows }: { rows: InsightsTeamRow[] }) {
  const [sortKey, setSortKey] = useState<TeamSortKey>("revenue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const mul = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => mul * (a[sortKey] - b[sortKey]));
  }, [rows, sortKey, sortDir]);

  function handleSort(key: TeamSortKey) {
    const next = nextSort(sortKey, sortDir, key);
    setSortKey(next.key);
    setSortDir(next.dir);
  }

  return (
    <div className="insights-table-wrap">
      <table className="listing-table insights-table is-team">
        <thead>
          <tr>
            <th>Receptionist</th>
            <SortHeader
              label="Opportunities"
              sortKey="opportunities"
              activeKey={sortKey}
              direction={sortDir}
              onSort={handleSort}
            />
            <SortHeader
              label="Sales"
              sortKey="sales"
              activeKey={sortKey}
              direction={sortDir}
              onSort={handleSort}
            />
            <SortHeader
              label="Conversion"
              sortKey="conversion"
              activeKey={sortKey}
              direction={sortDir}
              onSort={handleSort}
            />
            <SortHeader
              label="Revenue"
              sortKey="revenue"
              activeKey={sortKey}
              direction={sortDir}
              onSort={handleSort}
            />
            <th>Avg. sale</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.receptionist}>
              <td className="cell-action">{row.receptionist}</td>
              <td>{row.opportunities}</td>
              <td>{row.sales}</td>
              <td>{formatInsightsPercent(row.conversion)}</td>
              <td>{money.format(row.revenue)}</td>
              <td>{money.format(row.avgSale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
