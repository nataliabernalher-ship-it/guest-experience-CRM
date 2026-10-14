import type { InsightsCustomRange, InsightsPeriod } from "../../data/insights";
import { insightsPeriodOptions } from "../../data/insights";

export function InsightsPeriodFilter({
  period,
  customRange,
  onPeriodChange,
  onCustomRangeChange,
}: {
  period: InsightsPeriod;
  customRange: InsightsCustomRange;
  onPeriodChange: (period: InsightsPeriod) => void;
  onCustomRangeChange: (range: InsightsCustomRange) => void;
}) {
  return (
    <div className="insights-period-filter">
      <div className="guest-tags insights-period-tags" role="tablist" aria-label="Period">
        {insightsPeriodOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={period === option.id}
            className={period === option.id ? "guest-tag is-active" : "guest-tag"}
            onClick={() => onPeriodChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {period === "custom" ? (
        <div className="insights-custom-range">
          <label className="insights-custom-field">
            <span>From</span>
            <input
              type="date"
              className="incident-input"
              value={customRange.from}
              onChange={(event) => onCustomRangeChange({ ...customRange, from: event.target.value })}
            />
          </label>
          <label className="insights-custom-field">
            <span>To</span>
            <input
              type="date"
              className="incident-input"
              value={customRange.to}
              onChange={(event) => onCustomRangeChange({ ...customRange, to: event.target.value })}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
