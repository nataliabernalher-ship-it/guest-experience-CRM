import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  compareActions,
  guestById,
  guestHeadcount,
  guests,
  type Guest,
  isPending,
  last7Days,
  listings,
  money,
  reservationCount,
  type Category,
  type ShiftAction,
} from "../data/shift";
import { CategoryPill } from "../components/CategoryPill";
import { EmptyState, ErrorState, LoadingState } from "../components/ViewState";
import { IncidentDetailModal } from "../components/IncidentDetailModal";
import { OpportunityDetailModal } from "../components/OpportunityDetailModal";
import { useViewLoad } from "../hooks/useViewLoad";
import { useShift } from "../state/ShiftState";

const SHIFT_START_HOUR = 7;
const SHIFT_END_HOUR = 24; // 00:00
/** Sparse axis labels for the shift timeline (07 → 00). */
const TIMELINE_HOURS = [7, 12, 14, 18, 0] as const;

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

/** Maps a clock hour (0–23) onto the 07→00 shift axis as 0–100%. */
function hourToPercent(hour: number): number {
  const point = hour === 0 ? SHIFT_END_HOUR : hour;
  const span = SHIFT_END_HOUR - SHIFT_START_HOUR;
  return Math.min(100, Math.max(0, ((point - SHIFT_START_HOUR) / span) * 100));
}

function nowToPercent(now: Date): number {
  const hours = now.getHours() + now.getMinutes() / 60;
  if (hours < SHIFT_START_HOUR) return 0;
  return Math.min(100, ((hours - SHIFT_START_HOUR) / (SHIFT_END_HOUR - SHIFT_START_HOUR)) * 100);
}

function bandStyle(fromHour: number, toHour: number): { left: string; width: string } {
  const left = hourToPercent(fromHour);
  const right = hourToPercent(toHour === 0 ? 0 : toHour);
  return {
    left: `${left}%`,
    width: `${Math.max(0, right - left)}%`,
  };
}

function stayLine(guest: Guest): string {
  const stays = guest.previousStays === 1 ? "1 stay" : `${guest.previousStays} stays`;
  return `Room ${guest.room} · Arriving today · ${stays}`;
}

function VipStar() {
  return (
    <svg className="guest-vip-star" width="18" height="18" viewBox="0 0 18 18" aria-label="VIP" role="img">
      <path
        d="M9 1.6 11.1 6.2l5 .4-3.8 3.2 1.2 4.8L9 12.2l-4.5 2.4 1.2-4.8L1.9 6.6l5-.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function GuestMark({ guest }: { guest: Guest }) {
  if (guest.vip) return <VipStar />;
  if (guest.previousStays >= 1) return <span className="guest-badge is-returning">Returning</span>;
  return null;
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

const TREND_COLORS = {
  upselling: "#8a5a1e",
  loyalty: "#2f5f8a",
  "guest-experience": "#2f6b4f",
} as const;

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
  upselling,
  loyalty,
  pampered,
}: {
  labels: readonly string[];
  upselling: readonly number[];
  loyalty: readonly number[];
  pampered: readonly number[];
}) {
  const width = 280;
  const height = 96;
  const padX = 8;
  const padTop = 8;
  const padBottom = 8;
  const series = [
    { id: "upselling", color: TREND_COLORS.upselling, values: upselling },
    { id: "loyalty", color: TREND_COLORS.loyalty, values: loyalty },
    { id: "guest-experience", color: TREND_COLORS["guest-experience"], values: pampered },
  ].map((item) => ({
    ...item,
    ...seriesPath(item.values, width, height, padX, padTop, padBottom),
  }));

  return (
    <div className="upselling-trend-plot">
      <div className="upselling-trend-canvas">
        <svg
          className="upselling-trend-chart"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Upselling, loyalty and guests pampered over the last 7 days"
        >
          {series.map((item) => (
            <path
              key={item.id}
              className="upselling-trend-line"
              style={{ stroke: item.color }}
              d={item.line}
            />
          ))}
        </svg>
        <div className="upselling-trend-dots" aria-hidden="true">
          {series.flatMap((item) =>
            item.dots.map((point) => (
              <span
                key={`${item.id}-${point.key}`}
                className="upselling-trend-dot"
                style={{
                  left: point.left,
                  top: point.top,
                  borderColor: item.color,
                }}
              />
            )),
          )}
        </div>
      </div>
      <div className="upselling-trend-labels" aria-hidden="true">
        {labels.map((label, index) => (
          <span
            key={label}
            className={index === 0 ? "is-start" : index === labels.length - 1 ? "is-end" : undefined}
          >
            {label}
          </span>
        ))}
      </div>
      <p className="milestones-period">Last 7 days</p>
    </div>
  );
}

function InsightIcon({ category }: { category: Exclude<Category, "recovery"> }) {
  if (category === "upselling") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M10 2.2 11.5 7.6 17.2 9.2 11.5 10.8 10 16.2 8.5 10.8 2.8 9.2 8.5 7.6Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (category === "loyalty") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M10 2.6 15.8 9.5 10 16.4 4.2 9.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 16.4S3.8 12.2 3.8 8.2A3.2 3.2 0 0 1 10 6.8a3.2 3.2 0 0 1 6.2 1.4c0 4-6.2 8.2-6.2 8.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Dashboard() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    document.title = "Guest Experience";
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const { actions } = useShift();
  const { status, retry } = useViewLoad("dashboard");
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const checkInGuests = guests.filter(
    (guest) => guest.moment === "check-in" && checkInActionsForGuest(guest.id, actions).length > 0,
  );
  const checkOutReservations = reservationCount("check-out");
  const checkOutGuests = guestHeadcount("check-out");
  const checkInReservations = reservationCount("check-in");
  const checkInGuestCount = guestHeadcount("check-in");
  const progressPercent = nowToPercent(now);
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
        <div className="dashboard-greeting">
          <h1>{greeting(new Date())}</h1>
        </div>
      </header>

      <div className="dashboard-body">
        <div className="dashboard-left">
          <section className="context is-unified" aria-labelledby="shift-actions-heading">
            <header className="context-head">
              <h2 id="shift-actions-heading">Today&apos;s shift</h2>
            </header>
            <div className="shift-timeline" data-testid="shift-timeline">
              <div className="shift-timeline-track">
                <div className="shift-timeline-bands">
                  <Link
                    to={listings["check-outs"].path}
                    className="shift-band is-check-out"
                    style={bandStyle(7, 12)}
                    data-testid="context-check-outs"
                  >
                    <span className="shift-band-copy">
                      <span className="shift-band-title">Check-out</span>
                      <span className="shift-band-meta">
                        {checkOutReservations} check-outs / {checkOutGuests}{" "}
                        {checkOutGuests === 1 ? "guest" : "guests"}
                      </span>
                    </span>
                  </Link>
                  <Link
                    to={listings["check-ins"].path}
                    className="shift-band is-check-in"
                    style={bandStyle(14, 0)}
                    data-testid="context-check-ins"
                  >
                    <span className="shift-band-copy">
                      <span className="shift-band-title">Check-in</span>
                      <span className="shift-band-meta">
                        {checkInReservations} check-ins / {checkInGuestCount}{" "}
                        {checkInGuestCount === 1 ? "guest" : "guests"}
                      </span>
                    </span>
                  </Link>
                </div>
                <div
                  className="shift-timeline-progress"
                  style={{ width: `${progressPercent}%` }}
                  aria-hidden="true"
                />
                <div
                  className="shift-timeline-remaining"
                  style={{
                    left: `${progressPercent}%`,
                    width: `${Math.max(0, 100 - progressPercent)}%`,
                  }}
                  aria-hidden="true"
                />
                <div
                  className="shift-timeline-now"
                  style={{ left: `${progressPercent}%` }}
                  aria-label={`Current time ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`}
                />
                <div className="shift-timeline-hours" aria-hidden="true">
                  {TIMELINE_HOURS.map((hour) => (
                    <span
                      key={hour}
                      className="shift-timeline-hour"
                      style={{ left: `${hourToPercent(hour)}%` }}
                    >
                      <span className="shift-timeline-tick" />
                      {hourLabel(hour)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="insight-of-day" aria-labelledby="insight-heading" data-testid="insight-of-day">
            <header className="insight-of-day-head">
              <h2 id="insight-heading">Insight of the day</h2>
            </header>
            <div className="insight-metrics">
              <Link
                to={`${listings["check-ins"].path}?category=upselling`}
                className="insight-metric"
                data-testid="insight-upselling"
              >
                <span className="insight-metric-icon" aria-hidden="true">
                  <InsightIcon category="upselling" />
                </span>
                <span className="insight-metric-label">Upselling</span>
                <span className="insight-metric-value">{insightCounts.upselling}</span>
              </Link>
              <Link
                to={`${listings["check-ins"].path}?category=guest-experience`}
                className="insight-metric"
                data-testid="insight-amenities"
              >
                <span className="insight-metric-icon" aria-hidden="true">
                  <InsightIcon category="guest-experience" />
                </span>
                <span className="insight-metric-label">Special amenities</span>
                <span className="insight-metric-value">{insightCounts.guestExperience}</span>
              </Link>
              <Link
                to={`${listings["check-ins"].path}?category=loyalty`}
                className="insight-metric"
                data-testid="insight-loyalties"
              >
                <span className="insight-metric-icon" aria-hidden="true">
                  <InsightIcon category="loyalty" />
                </span>
                <span className="insight-metric-label">Loyalties</span>
                <span className="insight-metric-value">{insightCounts.loyalty}</span>
              </Link>
            </div>
          </section>

          <section className="results is-aside" aria-label="Milestones achieved">
            <header className="milestones-head">
              <h2>Milestones achieved</h2>
            </header>
            <div className="milestones-body">
              <div className="upselling-trend-chart-wrap" data-testid="upselling-trend">
                <MilestonesTrendChart
                  labels={last7Days.upsellingByDay.map((point) => point.label)}
                  upselling={last7Days.upsellingByDay.map((point) => point.value)}
                  loyalty={last7Days.loyaltyByDay.map((point) => point.value)}
                  pampered={last7Days.guestsPamperedByDay.map((point) => point.value)}
                />
              </div>
              <div className="results-metrics">
                <div className="result is-upselling" data-testid="upselling-total">
                  <span className="result-figure">
                    <TrendArrow direction={last7Days.upsellingRevenue.direction} />
                    <span className="result-value">{money.format(last7Days.upsellingRevenue.value)}</span>
                  </span>
                  <span className="result-label">Upselling total</span>
                </div>
                <div className="result is-loyalty" data-testid="metric-loyalty">
                  <span className="result-figure">
                    <TrendArrow direction={last7Days.loyaltySignUps.direction} />
                    <span className="result-value">{last7Days.loyaltySignUps.value}</span>
                  </span>
                  <span className="result-label">Loyalty sign-ups</span>
                </div>
                <div className="result is-pampered" data-testid="metric-pampered">
                  <span className="result-figure">
                    <TrendArrow direction={last7Days.guestsPampered.direction} />
                    <span className="result-value">{last7Days.guestsPampered.value}</span>
                  </span>
                  <span className="result-label">Guests pampered</span>
                </div>
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
                        <GuestMark guest={guest} />
                        {opportunity ? (
                          <CategoryPill category={opportunity.category} />
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
                          <span className={action.status === "pending" ? "incident-status" : "incident-status is-advanced"}>
                            {action.status === "notified" ? "Notified" : action.status === "solved" ? "Solved" : "Pending"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
              <div className="board-foot">
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
