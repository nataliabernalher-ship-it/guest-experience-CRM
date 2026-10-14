import type { InsightsSeriesPoint } from "../../data/insights";
import { money } from "../../data/shift";

function seriesPath(
  values: number[],
  width: number,
  height: number,
  padX: number,
  padTop: number,
  padBottom: number,
  max: number,
): string {
  const last = Math.max(values.length - 1, 1);
  const plotWidth = Math.max(width - padX * 2, 1);
  const plotBottom = height - padBottom;
  const plotHeight = Math.max(plotBottom - padTop, 1);
  return values
    .map((value, index) => {
      const x = padX + (index / last) * plotWidth;
      const y = plotBottom - (value / max) * plotHeight;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function UpsellingRevenueChart({ series }: { series: InsightsSeriesPoint[] }) {
  const width = 720;
  const height = 184;
  const padX = 44;
  const padTop = 12;
  const padBottom = 22;
  const max = Math.max(...series.flatMap((point) => [point.current, point.previous]), 1);
  const currentPath = seriesPath(
    series.map((point) => point.current),
    width,
    height,
    padX,
    padTop,
    padBottom,
    max,
  );
  const previousPath = seriesPath(
    series.map((point) => point.previous),
    width,
    height,
    padX,
    padTop,
    padBottom,
    max,
  );
  const yTicks = [0, 0.5, 1].map((ratio) => ({
    value: Math.round(max * ratio),
    y: height - padBottom - ratio * (height - padBottom - padTop),
  }));

  return (
    <div className="insights-revenue-chart" data-testid="insights-revenue-chart">
      <div className="insights-revenue-legend" aria-hidden="true">
        <span className="insights-legend-item is-current">Current period</span>
        <span className="insights-legend-item is-previous">Previous period</span>
      </div>
      <div className="insights-revenue-canvas">
        <svg
          className="insights-revenue-svg"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Upselling revenue over the selected period"
        >
          {yTicks.map((tick) => (
            <g key={tick.value}>
              <line
                className="insights-revenue-grid"
                x1={padX}
                y1={tick.y}
                x2={width - 12}
                y2={tick.y}
              />
              <text className="insights-revenue-axis" x={8} y={tick.y + 4}>
                {money.format(tick.value)}
              </text>
            </g>
          ))}
          <path className="insights-revenue-line is-previous" d={previousPath} />
          <path className="insights-revenue-line is-current" d={currentPath} />
        </svg>
        <div className="insights-revenue-labels" aria-hidden="true">
          {series.map((point) => (
            <span key={point.label}>{point.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
