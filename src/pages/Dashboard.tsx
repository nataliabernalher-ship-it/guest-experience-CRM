import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  compareActions,
  guestById,
  guestHeadcount,
  guests,
  type Guest,
  last7Days,
  listings,
  money,
  reservationCount,
  type ShiftAction,
} from "../data/shift";
import { CategoryPill } from "../components/CategoryPill";
import { IncidentDetailModal } from "../components/IncidentDetailModal";
import { OpportunityDetailModal } from "../components/OpportunityDetailModal";
import { ShiftCorner } from "../components/ShiftCorner";
import { useShift } from "../state/ShiftState";

const SHIFT_START_HOUR = 7;
const SHIFT_END_HOUR = 24; // 00:00
const TIMELINE_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0] as const;

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function hourLabel(hour: number): string {
  return String(hour).padStart(2, "0");
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

function GuestMark({ guest }: { guest: Guest }) {
  if (guest.vip) return <span className="guest-badge is-vip">VIP</span>;
  if (guest.previousStays >= 1) return <span className="guest-badge is-returning">Returning</span>;
  return <span className="guest-none">–</span>;
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
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const checkInGuests = guests.filter(
    (guest) => guest.moment === "check-in" && checkInActionsForGuest(guest.id, actions).length > 0,
  );
  const checkOutReservations = reservationCount("check-out");
  const checkOutGuests = guestHeadcount("check-out");
  const checkInReservations = reservationCount("check-in");
  const checkInGuestCount = guestHeadcount("check-in");
  const inHouseGuests = guestHeadcount("in-house");
  const progressPercent = nowToPercent(now);
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
        <ShiftCorner showShift />
      </header>

      <div className="dashboard-top">
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
                <Link
                  to={listings["in-house"].path}
                  className="shift-band is-in-house"
                  style={bandStyle(7, 0)}
                  data-testid="context-in-house"
                >
                  <span className="shift-band-copy">
                    <span className="shift-band-title">All day · In house</span>
                    <span className="shift-band-meta">
                      {inHouseGuests} {inHouseGuests === 1 ? "guest" : "guests"}
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
                aria-label={`Current time ${hourLabel(now.getHours())}`}
              />
              <div className="shift-timeline-hours" aria-hidden="true">
                {TIMELINE_HOURS.map((hour) => (
                  <span
                    key={hour}
                    className="shift-timeline-hour"
                    style={{ left: `${hourToPercent(hour)}%` }}
                  >
                    {hourLabel(hour)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="results is-aside" aria-label="Milestones achieved in the last 7 days">
          <h2>Milestones achieved in the last 7 days</h2>
          <div className="results-metrics">
            <div className="result" data-testid="metric-revenue">
              <span className="result-figure">
                <TrendArrow direction={last7Days.upsellingRevenue.direction} />
                <span className="result-value">{money.format(last7Days.upsellingRevenue.value)}</span>
              </span>
              <span className="result-label">Upselling revenue</span>
            </div>
            <div className="result" data-testid="metric-loyalty">
              <span className="result-figure">
                <TrendArrow direction={last7Days.loyaltySignUps.direction} />
                <span className="result-value">{last7Days.loyaltySignUps.value}</span>
              </span>
              <span className="result-label">Loyalty sign-ups</span>
            </div>
            <div className="result" data-testid="metric-pampered">
              <span className="result-figure">
                <TrendArrow direction={last7Days.guestsPampered.direction} />
                <span className="result-value">{last7Days.guestsPampered.value}</span>
              </span>
              <span className="result-label">Guests pampered</span>
            </div>
          </div>
        </section>
      </div>

      <div className="board">
        <section className="table-card is-checkins" aria-labelledby="checkins-heading" data-testid="today-check-ins">
          <header className="table-card-head">
            <h2 id="checkins-heading">Today check-in with actions</h2>
          </header>
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
            <ol className="priority board-scroll" data-testid="priority-list">
              {incidents.map((action) => {
                const guest = guestById(action.guestId);
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
                          {guest.name}
                          {" · Room "}
                          {guest.room}
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
            <div className="board-foot">
              <Link to={listings.recovery.path} className="view-all">
                View all
              </Link>
            </div>
          </section>
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
