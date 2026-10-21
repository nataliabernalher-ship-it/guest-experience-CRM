import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  guestById,
  guests,
  type Guest,
  isPending,
  listings,
  milestonePeriodOptions,
  milestonesForPeriod,
  type MilestonePeriod,
  money,
  peopleCount,
  reservationCount,
  type ShiftAction,
  upsellingPotentialByOffer,
  type UpsellPotentialRow,
} from "../data/shift";
import { CategoryIcon, CategoryPill } from "../components/CategoryPill";
import { OutcomeMark } from "../components/OutcomeMark";
import { EmptyState, ErrorState, LoadingState } from "../components/ViewState";
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

function stayLine(guest: Guest, moment: "check-in" | "in-house" = "check-in"): string {
  const stays = guest.previousStays === 1 ? "1 stay" : `${guest.previousStays} stays`;
  const momentLabel = moment === "in-house" ? "In-house" : "Arriving today";
  return `Room ${guest.room} · ${momentLabel} · ${stays}`;
}

function actionsForGuest(
  guestId: string,
  listing: "check-ins" | "in-house",
  source: ShiftAction[],
): ShiftAction[] {
  return source.filter(
    (action) => action.guestId === guestId && action.listing === listing && action.category !== "recovery",
  );
}

function checkInActionsForGuest(guestId: string, source: ShiftAction[]): ShiftAction[] {
  return actionsForGuest(guestId, "check-ins", source);
}

function opportunityForGuest(
  guestId: string,
  source: ShiftAction[],
  listing: "check-ins" | "in-house" = "check-ins",
): ShiftAction | undefined {
  const forGuest = actionsForGuest(guestId, listing, source);
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
  upselling: "#FF6544",
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

const UPSELL_BARS_ANIMATED_KEY = "dashboard-upsell-bars-animated";

function UpsellingPotentialChart({ rows }: { rows: UpsellPotentialRow[] }) {
  const max = Math.max(...rows.map((row) => row.amount), 1);
  const shouldAnimate = useRef(
    typeof sessionStorage === "undefined" || sessionStorage.getItem(UPSELL_BARS_ANIMATED_KEY) !== "1",
  ).current;
  const [play, setPlay] = useState(!shouldAnimate);

  useEffect(() => {
    if (!shouldAnimate) return;
    const frame = requestAnimationFrame(() => {
      setPlay(true);
      try {
        sessionStorage.setItem(UPSELL_BARS_ANIMATED_KEY, "1");
      } catch {
        /* ignore */
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [shouldAnimate]);

  if (rows.length === 0) {
    return <p className="upsell-potential-empty">No pending upselling potential right now.</p>;
  }

  return (
    <div
      className={play ? "upsell-potential is-animated" : "upsell-potential"}
      data-testid="upselling-potential-chart"
    >
      <ul className="upsell-potential-bars" aria-label="Upselling potential for today">
        {rows.map((row, index) => (
          <li key={row.offer} className="upsell-potential-row">
            <div className="upsell-potential-meta">
              <span className="upsell-potential-offer">{row.offer}</span>
              <span className="upsell-potential-amount">{money.format(row.amount)}</span>
            </div>
            <div className="upsell-potential-track" aria-hidden="true">
              <span
                className={shouldAnimate ? "upsell-potential-fill is-entrance" : "upsell-potential-fill"}
                style={{
                  width: `${Math.max((row.amount / max) * 100, 4)}%`,
                  transitionDelay: shouldAnimate ? `${index * 90}ms` : undefined,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
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
          <span key={day} style={{ left: series.dots[index]?.left }}>
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
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [milestoneMetric, setMilestoneMetric] = useState<MilestoneMetric>("upselling");
  const [milestonePeriod, setMilestonePeriod] = useState<MilestonePeriod>("7days");
  const milestones = milestonesForPeriod(milestonePeriod);
  const checkInGuests = guests.filter(
    (guest) => guest.moment === "check-in" && checkInActionsForGuest(guest.id, actions).length > 0,
  );
  const inHouseActionGuests = guests.filter(
    (guest) =>
      guest.moment === "in-house" && actionsForGuest(guest.id, "in-house", actions).length > 0,
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
  const upsellPotential = upsellingPotentialByOffer(actions);
  const earningsPotential = upsellPotential.reduce((sum, row) => sum + row.amount, 0);
  const earningsAchieved = actions.reduce((sum, action) => {
    if (action.category !== "upselling" || action.status !== "done" || action.value == null) return sum;
    try {
      return sum + Math.max(guestById(action.guestId).partySize, 1) * action.value;
    } catch {
      return sum + action.value;
    }
  }, 0);
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
          <section className="insight-of-day" aria-label="Today insights" data-testid="insight-of-day">
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
                  <span className="insight-metric-when">Today</span>
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
                  <span className="insight-metric-when">Today</span>
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
                  <span className="insight-metric-when">Today</span>
                  <span className="insight-metric-label">Loyalty sign-ups</span>
                  <span className="insight-metric-value">{insightCounts.loyalty}</span>
                </span>
              </Link>
            </div>
          </section>

          <section className="results is-aside" aria-label="Milestones achieved">
            <header className="milestones-head">
              <h2>Milestones achieved</h2>
              <div className="guest-tags milestones-period" role="tablist" aria-label="Milestones period">
                {milestonePeriodOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={milestonePeriod === option.id}
                    className={
                      milestonePeriod === option.id ? "guest-tag is-active" : "guest-tag"
                    }
                    onClick={() => setMilestonePeriod(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </header>
            <div className="milestones-body">
              <div className="upselling-trend-stack">
                <div className="upselling-trend-chart-wrap" data-testid="upselling-trend">
                  <MilestonesTrendChart
                    labels={milestones.upsellingByDay.map((point) => point.label)}
                    metric={milestoneMetric}
                    label={
                      milestoneMetric === "upselling"
                        ? "Upselling"
                        : milestoneMetric === "loyalty"
                          ? "Loyalty sign-ups"
                          : "Special amenities"
                    }
                    values={
                      milestoneMetric === "upselling"
                        ? milestones.upsellingByDay.map((point) => point.value)
                        : milestoneMetric === "loyalty"
                          ? milestones.loyaltyByDay.map((point) => point.value)
                          : milestones.guestsPamperedByDay.map((point) => point.value)
                    }
                  />
                </div>
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
                    <TrendArrow direction={milestones.upsellingRevenue.direction} />
                    <span className="result-value">{money.format(milestones.upsellingRevenue.value)}</span>
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
                    <TrendArrow direction={milestones.loyaltySignUps.direction} />
                    <span className="result-value">{milestones.loyaltySignUps.value}</span>
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
                    <TrendArrow direction={milestones.guestsPampered.direction} />
                    <span className="result-value">{milestones.guestsPampered.value}</span>
                  </span>
                  <span className="result-label">Guests pampered</span>
                </button>
              </div>
            </div>
            <Link to="/insight" className="milestones-reports-link">
              See reports
            </Link>
          </section>
        </div>

        <div className="board">
          <div className="board-center">
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
                <ul className="vip-list is-checkins-fit">
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

            <section className="table-card is-inhouse" aria-labelledby="inhouse-heading" data-testid="today-in-house">
              <header className="table-card-head">
                <h2 id="inhouse-heading">Today in-house with actions</h2>
              </header>
              {status === "loading" ? (
                <LoadingState
                  title="Loading in-house"
                  description="We’re gathering in-house guests that still need an action."
                />
              ) : status === "error" ? (
                <ErrorState
                  title="Couldn’t load in-house"
                  description="Something went wrong while loading in-house guests. Try again, or open the full in-house list."
                  action={
                    <>
                      <button type="button" className="add-incident" onClick={retry}>
                        Try again
                      </button>
                      <Link to={listings["in-house"].path} className="view-all">
                        View all in-house
                      </Link>
                    </>
                  }
                />
              ) : inHouseActionGuests.length === 0 ? (
                <EmptyState
                  title="No in-house guests need action"
                  description="There are no in-house guests with pending opportunities right now. You can still browse the full in-house list."
                  action={
                    <Link to={listings["in-house"].path} className="view-all">
                      View all in-house
                    </Link>
                  }
                />
              ) : (
                <ul className="vip-list is-checkins-fit">
                  {inHouseActionGuests.map((guest) => {
                    const opportunity = opportunityForGuest(guest.id, actions, "in-house");
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
                            <span className="vip-meta">{stayLine(guest, "in-house")}</span>
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
                  <span className="board-foot-count-value">{inHouseActionGuests.length}</span>
                  <span className="board-foot-count-label">
                    {inHouseActionGuests.length === 1 ? "guest" : "guests"}
                  </span>
                </p>
                <Link to={listings["in-house"].path} className="view-all">
                  View all
                </Link>
              </div>
            </section>
          </div>

          <div className="board-side">
            <section
              className="earnings-today"
              aria-labelledby="earnings-today-heading"
              data-testid="earnings-today"
            >
              <div className="earnings-today-head">
                <h2 id="earnings-today-heading">Earnings potential for today</h2>
                <p className="earnings-today-value">{`${earningsPotential.toLocaleString("en-GB")}€`}</p>
              </div>
              <div className="earnings-today-spacer" aria-hidden="true" />
              <div className="earnings-today-foot">
                <span>Achieved so far</span>
                <span>{`${earningsAchieved.toLocaleString("en-GB")}€`}</span>
              </div>
            </section>
            <section className="panel is-upsell-potential" aria-labelledby="upsell-potential-heading">
              <div className="panel-head">
                <h2 id="upsell-potential-heading">Upselling potential for today</h2>
              </div>
              <div className="board-scroll">
                <UpsellingPotentialChart rows={upsellPotential} />
              </div>
            </section>
          </div>
        </div>
      </div>
      {selectedOpportunity ? (
        <OpportunityDetailModal action={selectedOpportunity} onClose={() => setSelectedOpportunityId(null)} />
      ) : null}
    </div>
  );
}
