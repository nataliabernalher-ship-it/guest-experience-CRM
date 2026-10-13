import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  compareActions,
  guestById,
  guests,
  type Guest,
  isPending,
  last7Days,
  listings,
  money,
  peopleCount,
  reservationCount,
  type ShiftAction,
} from "../data/shift";
import { CategoryIcon, CategoryPill } from "../components/CategoryPill";
import { OutcomeMark } from "../components/OutcomeMark";
import { EmptyState, ErrorState, LoadingState } from "../components/ViewState";
import { IncidentDetailModal } from "../components/IncidentDetailModal";
import { OpportunityDetailModal } from "../components/OpportunityDetailModal";
import { useViewLoad } from "../hooks/useViewLoad";
import { useShift } from "../state/ShiftState";

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning, Clara";
  if (hour < 18) return "Good afternoon, Clara";
  return "Good evening, Clara";
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M6 3.5 10.5 8 6 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function stayLine(guest: Guest): string {
  const stays = guest.previousStays === 1 ? "1 stay" : `${guest.previousStays} stays`;
  return `Room ${guest.room} · Arriving today · ${stays}`;
}

function checkInActionsForGuest(guestId: string, source: ShiftAction[]): ShiftAction[] {
  return source.filter(
    (action) => action.guestId === guestId && action.listing === "check-ins" && action.category !== "recovery",
  );
}

function opportunityForGuest(guestId: string, source: ShiftAction[]): ShiftAction | undefined {
  const forGuest = checkInActionsForGuest(guestId, source);
  return forGuest.find((action) => action.status === "pending") ?? forGuest[0];
}

function TrendArrow({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      className={`trend-arrow is-${direction}`}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-label={direction === "up" ? "Up" : "Down"}
      role="img"
    >
      <path
        d="M7 11.5V2.5M7 2.5 3 6.5M7 2.5l4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type MilestoneMetric = "upselling" | "loyalty" | "pampered";

/** Solid hue matching category tag colors (text / tag fill base). */
const TREND_COLORS: Record<MilestoneMetric, string> = {
  upselling: "#8a5a1e",
  loyalty: "#2f5f8a",
  pampered: "#2f6b4f",
};

type TrendDot = { key: string; x: number; y: number; left: string; top: string };

function seriesPath(
  values: readonly number[],
  width: number,
  height: number,
  padX: number,
  padTop: number,
  padBottom: number,
): { line: string; dots: TrendDot[] } {
  const max = Math.max(...values, 1);
  const last = Math.max(values.length - 1, 1);
  const plotWidth = Math.max(width - padX * 2, 1);
  const plotBottom = height - padBottom;
  const plotHeight = Math.max(plotBottom - padTop, 1);
  const dots = values.map((value, index) => {
    const x = padX + (index / last) * plotWidth;
    const y = plotBottom - (value / max) * plotHeight;
    return {
      key: String(index),
      x,
      y,
      left: `${(x / width) * 100}%`,
      top: `${(y / height) * 100}%`,
    };
  });
  const line = dots
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
  return { line, dots };
}

function MilestonesTrendChart({
  labels,
  values,
  metric,
  label,
}: {
  labels: readonly string[];
  values: readonly number[];
  metric: MilestoneMetric;
  label: string;
}) {
  const width = 280;
  const height = 64;
  const padX = 8;
  const padTop = 6;
  const padBottom = 6;
  const color = TREND_COLORS[metric];
  const series = seriesPath(values, width, height, padX, padTop, padBottom);

  return (
    <div className="upselling-trend-plot">
      <div className="upselling-trend-canvas">
        <svg
          className="upselling-trend-chart"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${label} over the last 7 days`}
        >
          <g className="upselling-trend-grid" aria-hidden="true">
            {series.dots.map((point) => (
              <line
                key={`grid-${point.key}`}
                className="upselling-trend-grid-line"
                x1={point.x}
                y1={padTop}
                x2={point.x}
                y2={height - padBottom}
              />
            ))}
          </g>
          <path className="upselling-trend-line" style={{ stroke: color }} d={series.line} />
        </svg>
        <div className="upselling-trend-dots" aria-hidden="true">
          {series.dots.map((point) => (
            <span
              key={point.key}
              className="upselling-trend-dot"
              style={{
                left: point.left,
                top: point.top,
                borderColor: color,
              }}
            />
          ))}
        </div>
      </div>
      <div className="upselling-trend-labels" aria-hidden="true">
        {labels.map((day, index) => (
          <span
            key={day}
            className={index === 0 ? "is-start" : index === labels.length - 1 ? "is-end" : undefined}
          >
            {day}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  useEffect(() => {
    document.title = "Guest Experience";
  }, []);

  const { actions } = useShift();
  const { status, retry } = useViewLoad("dashboard");
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [milestoneMetric, setMilestoneMetric] = useState<MilestoneMetric>("upselling");
  const checkInGuests = guests.filter(
    (guest) => guest.moment === "check-in" && checkInActionsForGuest(guest.id, actions).length > 0,
  );
  const checkOutReservations = reservationCount("check-out");
  const checkInReservations = checkInGuests.length;
  const inHouseGuests = peopleCount("in-house");
  const pendingOpportunities = actions.filter(
    (action) => action.category !== "recovery" && isPending(action),
  );
  const insightCounts = {
    upselling: pendingOpportunities.filter((action) => action.category === "upselling").length,
    guestExperience: pendingOpportunities.filter((action) => action.category === "guest-experience").length,
    loyalty: pendingOpportunities.filter((action) => action.category === "loyalty").length,
  };
  const incidents = actions
    .filter(
      (action) =>
        action.category === "recovery" &&
        (action.status === "pending" || action.status === "notified" || action.status === "solved"),
    )
    .sort(compareActions);
  const selectedIncident =
    selectedIncidentId == null
      ? null
      : actions.find((action) => action.id === selectedIncidentId && action.category === "recovery") ?? null;
  const selectedOpportunity =
    selectedOpportunityId == null
      ? null
      : actions.find((action) => action.id === selectedOpportunityId && action.category !== "recovery") ?? null;

  return (
    <div className="page" data-testid="dashboard">
      <header className="page-header is-dashboard">
        <div className="dashboard-hero-row">
          <div className="dashboard-greeting">
            <h1>{greeting(new Date())}</h1>
          </div>
          <div className="shift-cards" data-testid="shift-cards" aria-label="Today's shift">
            <Link to={listings["check-ins"].path} className="shift-card is-check-ins" data-testid="context-check-ins">
              <span className="shift-card-count">{checkInReservations}</span>
              <span className="shift-card-copy">
                <span className="shift-card-label">Check-ins</span>
                <span className="shift-card-meta">reservations</span>
              </span>
              <span className="shift-card-arrow" aria-hidden="true">
                <ChevronRightIcon />
              </span>
            </Link>
            <Link to={listings["in-house"].path} className="shift-card is-in-house" data-testid="context-in-house">
              <span className="shift-card-count">{inHouseGuests}</span>
              <span className="shift-card-copy">
                <span className="shift-card-label">In-house</span>
                <span className="shift-card-meta">guests</span>
              </span>
              <span className="shift-card-arrow" aria-hidden="true">
                <ChevronRightIcon />
              </span>
            </Link>
            <Link
              to={listings["check-outs"].path}
              className="shift-card is-check-outs"
              data-testid="context-check-outs"
            >
              <span className="shift-card-count">{checkOutReservations}</span>
              <span className="shift-card-copy">
                <span className="shift-card-label">Check-outs</span>
                <span className="shift-card-meta">reservations</span>
              </span>
              <span className="shift-card-arrow" aria-hidden="true">
                <ChevronRightIcon />
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="dashboard-body">
        <div className="dashboard-left">
          <section className="insight-of-day" aria-labelledby="insight-heading" data-testid="insight-of-day">
            <header className="insight-of-day-head">
              <h2 id="insight-heading">Insight of the day</h2>
            </header>
            <div className="insight-metrics">
              <Link
                to={`${listings["check-ins"].path}?category=upselling`}
                className="insight-metric"
                data-category="upselling"
                data-testid="insight-upselling"
              >
                <span className="insight-metric-icon" aria-hidden="true">
                  <CategoryIcon category="upselling" />
                </span>
                <span className="insight-metric-copy">
                  <span className="insight-metric-label">Upselling opportunities</span>
                  <span className="insight-metric-value">{insightCounts.upselling}</span>
                </span>
              </Link>
              <Link
                to={`${listings["check-ins"].path}?category=guest-experience`}
                className="insight-metric"
                data-category="guest-experience"
                data-testid="insight-amenities"
              >
                <span className="insight-metric-icon" aria-hidden="true">
                  <CategoryIcon category="guest-experience" />
                </span>
                <span className="insight-metric-copy">
                  <span className="insight-metric-label">Special amenities</span>
                  <span className="insight-metric-value">{insightCounts.guestExperience}</span>
                </span>
              </Link>
              <Link
                to={`${listings["check-ins"].path}?category=loyalty`}
                className="insight-metric"
                data-category="loyalty"
                data-testid="insight-loyalties"
              >
                <span className="insight-metric-icon" aria-hidden="true">
                  <CategoryIcon category="loyalty" />
                </span>
                <span className="insight-metric-copy">
                  <span className="insight-metric-label">Loyalty sign-ups</span>
                  <span className="insight-metric-value">{insightCounts.loyalty}</span>
                </span>
              </Link>
            </div>
          </section>

          <section className="results is-aside" aria-label="Milestones achieved">
            <header className="milestones-head">
              <h2>Milestones achieved</h2>
            </header>
            <div className="milestones-body">
              <div className="upselling-trend-stack">
                <div className="upselling-trend-chart-wrap" data-testid="upselling-trend">
                  <MilestonesTrendChart
                    labels={last7Days.upsellingByDay.map((point) => point.label)}
                    metric={milestoneMetric}
                    label={
                      milestoneMetric === "upselling"
                        ? "Upselling"
                        : milestoneMetric === "loyalty"
                          ? "Loyalty sign-ups"
                          : "Guests pampered"
                    }
                    values={
                      milestoneMetric === "upselling"
                        ? last7Days.upsellingByDay.map((point) => point.value)
                        : milestoneMetric === "loyalty"
                          ? last7Days.loyaltyByDay.map((point) => point.value)
                          : last7Days.guestsPamperedByDay.map((point) => point.value)
                    }
                  />
                </div>
                <p className="milestones-period">Last 7 days</p>
              </div>
              <div className="results-metrics" role="tablist" aria-label="Milestone metric">
                <button
                  type="button"
                  role="tab"
                  aria-selected={milestoneMetric === "upselling"}
                  className={
                    milestoneMetric === "upselling"
                      ? "result is-upselling is-selected"
                      : "result is-upselling"
                  }
                  data-testid="upselling-total"
                  onClick={() => setMilestoneMetric("upselling")}
                >
                  <span className="result-figure">
                    <TrendArrow direction={last7Days.upsellingRevenue.direction} />
                    <span className="result-value">{money.format(last7Days.upsellingRevenue.value)}</span>
                  </span>
                  <span className="result-label">Upselling total</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={milestoneMetric === "loyalty"}
                  className={
                    milestoneMetric === "loyalty" ? "result is-loyalty is-selected" : "result is-loyalty"
                  }
                  data-testid="metric-loyalty"
                  onClick={() => setMilestoneMetric("loyalty")}
                >
                  <span className="result-figure">
                    <TrendArrow direction={last7Days.loyaltySignUps.direction} />
                    <span className="result-value">{last7Days.loyaltySignUps.value}</span>
                  </span>
                  <span className="result-label">Loyalty sign-ups</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={milestoneMetric === "pampered"}
                  className={
                    milestoneMetric === "pampered"
                      ? "result is-pampered is-selected"
                      : "result is-pampered"
                  }
                  data-testid="metric-pampered"
                  onClick={() => setMilestoneMetric("pampered")}
                >
                  <span className="result-figure">
                    <TrendArrow direction={last7Days.guestsPampered.direction} />
                    <span className="result-value">{last7Days.guestsPampered.value}</span>
                  </span>
                  <span className="result-label">Guests pampered</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="board">
          <section className="table-card is-checkins" aria-labelledby="checkins-heading" data-testid="today-check-ins">
            <header className="table-card-head">
              <h2 id="checkins-heading">Today check-in with actions</h2>
            </header>
            {status === "loading" ? (
              <LoadingState
                title="Loading check-ins"
                description="We’re gathering today’s arrivals that still need an action."
              />
            ) : status === "error" ? (
              <ErrorState
                title="Couldn’t load check-ins"
                description="Something went wrong while loading arrivals. Try again, or open the full check-in list."
                action={
                  <>
                    <button type="button" className="add-incident" onClick={retry}>
                      Try again
                    </button>
                    <Link to={listings["check-ins"].path} className="view-all">
                      View all check-ins
                    </Link>
                  </>
                }
              />
            ) : checkInGuests.length === 0 ? (
              <EmptyState
                title="No check-ins need action"
                description="There are no arriving guests with pending opportunities right now. You can still browse the full check-in list."
                action={
                  <Link to={listings["check-ins"].path} className="view-all">
                    View all check-ins
                  </Link>
                }
              />
            ) : (
              <ul className="vip-list board-scroll">
                {checkInGuests.map((guest) => {
                  const opportunity = opportunityForGuest(guest.id, actions);
                  return (
                    <li key={guest.id}>
                      <button
                        type="button"
                        className="vip-row is-checkin is-actionable"
                        onClick={() => {
                          if (opportunity) setSelectedOpportunityId(opportunity.id);
                        }}
                      >
                        <span className="vip-copy">
                          <span className="vip-name">{guest.name}</span>
                          <span className="vip-meta">{stayLine(guest)}</span>
                        </span>
                        {opportunity ? (
                          opportunity.status === "done" ? (
                            <OutcomeMark rejected={false} />
                          ) : opportunity.status === "rejected" ? (
                            <OutcomeMark rejected />
                          ) : (
                            <CategoryPill category={opportunity.category} />
                          )
                        ) : (
                          <span className="guest-none">–</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="board-foot">
              <p className="board-foot-count">
                <span className="board-foot-count-value">{checkInGuests.length}</span>
                <span className="board-foot-count-label">
                  {checkInGuests.length === 1 ? "check-in" : "check-ins"}
                </span>
              </p>
              <Link to={listings["check-ins"].path} className="view-all">
                View all
              </Link>
            </div>
          </section>

          <div className="board-side">
            <section className="panel" aria-labelledby="priority-heading">
              <div className="panel-head">
                <h2 id="priority-heading">Incidents that need to be resolved</h2>
              </div>
              {status === "loading" ? (
                <LoadingState
                  title="Loading incidents"
                  description="We’re collecting open incidents that still need follow-up."
                />
              ) : status === "error" ? (
                <ErrorState
                  title="Couldn’t load incidents"
                  description="The priority list didn’t load. Try again, or open Recovery to continue."
                  action={
                    <>
                      <button type="button" className="add-incident" onClick={retry}>
                        Try again
                      </button>
                      <Link to={listings.recovery.path} className="view-all">
                        Open Recovery
                      </Link>
                    </>
                  }
                />
              ) : incidents.length === 0 ? (
                <EmptyState
                  title="No open incidents"
                  description="Nothing urgent is waiting right now. Open Recovery if you need to review closed cases or add a new incident."
                  action={
                    <Link to={listings.recovery.path} className="view-all">
                      Open Recovery
                    </Link>
                  }
                />
              ) : (
                <ol className="priority board-scroll" data-testid="priority-list">
                  {incidents.map((action) => {
                    let guestName = "Unknown guest";
                    let guestRoom = "—";
                    try {
                      const guest = guestById(action.guestId);
                      guestName = guest.name;
                      guestRoom = guest.room;
                    } catch {
                      /* keep fallback labels */
                    }
                    return (
                      <li key={action.id}>
                        <button
                          type="button"
                          className="priority-row"
                          data-testid="priority-action"
                          data-severity={action.severity ?? "none"}
                          onClick={() => setSelectedIncidentId(action.id)}
                        >
                          <span className={`severity severity-${action.severity ?? "none"}`}>
                            {action.severity}
                          </span>
                          <span className="priority-copy">
                            <span className="priority-label">{action.label}</span>
                            <span className="priority-meta">
                              {guestName}
                              {" · Room "}
                              {guestRoom}
                            </span>
                          </span>
                          <span className="incident-status">
                            {action.status === "notified"
                              ? "Notified"
                              : action.status === "solved"
                                ? "Solved"
                                : "Pending"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
              <div className="board-foot">
                <p className="board-foot-count">
                  <span className="board-foot-count-value">{incidents.length}</span>
                  <span className="board-foot-count-label">
                    {incidents.length === 1 ? "incident" : "incidents"}
                  </span>
                </p>
                <Link to={listings.recovery.path} className="view-all">
                  View all
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
      {selectedIncident ? (
        <IncidentDetailModal action={selectedIncident} onClose={() => setSelectedIncidentId(null)} />
      ) : null}
      {selectedOpportunity ? (
        <OpportunityDetailModal action={selectedOpportunity} onClose={() => setSelectedOpportunityId(null)} />
      ) : null}
    </div>
  );
}
