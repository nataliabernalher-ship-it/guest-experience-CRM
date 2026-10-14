import { useEffect, useMemo, useState } from "react";
import { GuestInsightsPanel } from "../components/insights/GuestInsightsPanel";
import { InsightsKpiCards } from "../components/insights/InsightsKpiCards";
import { InsightsPeriodFilter } from "../components/insights/InsightsPeriodFilter";
import { RevenueByCategoryChart } from "../components/insights/RevenueByCategoryChart";
import { TeamPerformanceTable } from "../components/insights/TeamPerformanceTable";
import { TopAutomationsTable } from "../components/insights/TopAutomationsTable";
import { UpsellingRevenueChart } from "../components/insights/UpsellingRevenueChart";
import {
  getInsightsData,
  type GuestInsightTab,
  type InsightsCustomRange,
  type InsightsPeriod,
} from "../data/insights";

function defaultCustomRange(): InsightsCustomRange {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 14);
  const fmt = (date: Date) => date.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export function InsightPage() {
  const [period, setPeriod] = useState<InsightsPeriod>("30d");
  const [customRange, setCustomRange] = useState<InsightsCustomRange>(defaultCustomRange);
  const [guestTab, setGuestTab] = useState<GuestInsightTab>("traveller");

  useEffect(() => {
    document.title = "Reports · Guest Experience";
  }, []);

  const data = useMemo(
    () => getInsightsData(period, period === "custom" ? customRange : null),
    [period, customRange],
  );

  return (
    <div className="page insights-page" data-testid="insight">
      <header className="page-header">
        <div className="page-header-bar">
          <h1>Reports</h1>
        </div>
      </header>

      <div className="insights-stack">
        <div className="insights-toolbar">
          <InsightsPeriodFilter
            period={period}
            customRange={customRange}
            onPeriodChange={setPeriod}
            onCustomRangeChange={setCustomRange}
          />
        </div>

        <section className="insights-section" aria-labelledby="insights-business-heading">
          <h2 id="insights-business-heading" className="insights-section-title">
            Business performance
          </h2>
          <div className="insights-business-layout">
            <InsightsKpiCards kpis={data.kpis} />
            <section className="table-card insights-chart-card" aria-labelledby="upselling-revenue-heading">
              <header className="table-card-head">
                <h2 id="upselling-revenue-heading">Upselling revenue</h2>
              </header>
              <UpsellingRevenueChart series={data.revenueSeries} />
            </section>
          </div>
        </section>

        <section className="insights-section" aria-labelledby="insights-works-heading">
          <h2 id="insights-works-heading" className="insights-section-title">
            What works
          </h2>
          <div className="insights-split">
            <section className="table-card" aria-labelledby="revenue-category-heading">
              <header className="table-card-head">
                <h2 id="revenue-category-heading">Revenue by category</h2>
              </header>
              <RevenueByCategoryChart rows={data.categories} />
            </section>
            <section className="table-card" aria-labelledby="top-automations-heading">
              <header className="table-card-head">
                <h2 id="top-automations-heading">Top automations</h2>
              </header>
              <TopAutomationsTable rows={data.automations} />
            </section>
          </div>
        </section>

        <section className="insights-section" aria-labelledby="guest-insights-heading">
          <h2 id="guest-insights-heading" className="insights-section-title">
            Guest insights
          </h2>
          <section className="table-card insights-panel-card">
            <GuestInsightsPanel
              activeTab={guestTab}
              onTabChange={setGuestTab}
              rows={data.guestTabs[guestTab]}
              note={data.guestNotes[guestTab]}
            />
          </section>
        </section>

        <section className="insights-section" aria-labelledby="team-performance-heading">
          <h2 id="team-performance-heading" className="insights-section-title">
            Team performance
          </h2>
          <section className="table-card insights-panel-card">
            <TeamPerformanceTable rows={data.team} />
          </section>
        </section>
      </div>
    </div>
  );
}
