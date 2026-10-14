import type { GuestInsightTab, InsightsGuestSegmentRow } from "../../data/insights";
import { formatInsightsPercent, guestInsightTabLabels } from "../../data/insights";
import { money } from "../../data/shift";

const tabs: GuestInsightTab[] = ["country", "age", "traveller", "guest-type"];

export function GuestInsightsPanel({
  activeTab,
  onTabChange,
  rows,
  note,
}: {
  activeTab: GuestInsightTab;
  onTabChange: (tab: GuestInsightTab) => void;
  rows: InsightsGuestSegmentRow[];
  note: string;
}) {
  return (
    <div className="insights-guest-panel">
      <div className="guest-tags" role="tablist" aria-label="Guest insight dimension">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? "guest-tag is-active" : "guest-tag"}
            onClick={() => onTabChange(tab)}
          >
            {guestInsightTabLabels[tab]}
          </button>
        ))}
      </div>
      <div className="insights-table-wrap">
        <table className="listing-table insights-table">
          <thead>
            <tr>
              <th>Segment</th>
              <th>Revenue</th>
              <th>Conversion</th>
              <th>Top service</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.segment}>
                <td className="cell-action">{row.segment}</td>
                <td>{money.format(row.revenue)}</td>
                <td>{formatInsightsPercent(row.conversion)}</td>
                <td>{row.topService}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="insights-guest-note">{note}</p>
    </div>
  );
}
