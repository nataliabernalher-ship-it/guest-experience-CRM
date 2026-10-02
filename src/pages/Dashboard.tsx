import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  compareActions,
  countForListing,
  guestById,
  guestHeadcount,
  returningGuests,
  type Guest,
  isPending,
  last7Days,
  listings,
  momentCategoryCounts,
  money,
  reservationCount,
  shiftDateLabel,
} from "../data/shift";
import { useShift } from "../state/ShiftState";

const stayListings = ["check-ins", "in-house", "check-outs"] as const;

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function shiftName(now: Date): string {
  const hour = now.getHours();
  if (hour >= 6 && hour < 14) return "Morning shift";
  if (hour >= 14 && hour < 22) return "Evening shift";
  return "Night shift";
}

function stayLine(guest: Guest): string {
  const where =
    guest.moment === "check-in"
      ? "Arriving today"
      : guest.moment === "check-out"
        ? "Departing today"
        : "In-house";
  const stays = guest.previousStays === 1 ? "1 stay" : `${guest.previousStays} stays`;
  return `Room ${guest.room} · ${where} · ${stays}`;
}

function OpenArrow() {
  return (
    <svg className="context-arrow" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M3.5 10.5 10.5 3.5M5.5 3.5h5v5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
  useEffect(() => {
    document.title = "Guest Experience";
  }, []);

  const { actions } = useShift();
  const pending = actions.filter(isPending);
  const incidents = actions
    .filter(
      (action) =>
        action.category === "recovery" &&
        (action.status === "pending" || action.status === "notified" || action.status === "solved"),
    )
    .sort(compareActions);

  return (
    <div className="page" data-testid="dashboard">
      <header className="page-header is-split">
        <div>
          <p className="eyebrow">Today&apos;s shift</p>
          <h1>{greeting(new Date())}</h1>
        </div>
        <p className="shift-corner">
          <span>{shiftDateLabel}</span>
          <span>{shiftName(new Date())}</span>
        </p>
      </header>

      <section className="context" aria-label="Shift context">
        {stayListings.map((id) => {
          const listing = listings[id];
          const counts = momentCategoryCounts(id, pending);
          const moment = listing.moment!;
          const reservations = reservationCount(moment);
          const guests = guestHeadcount(moment);
          return (
            <Link
              key={id}
              to={listing.path}
              className="context-card"
              data-testid={`context-${id}`}
            >
              <OpenArrow />
              <span className="context-total">
                <span className="context-figures">
                  <span className="context-count">{reservations}</span>
                  <span className="context-people">
                    {guests} {guests === 1 ? "guest" : "guests"}
                  </span>
                </span>
                <span className="context-label">{listing.title}</span>
              </span>
              <span className="context-attention">
                <span className="context-breakdown">
                  <span>{counts.upselling} Upselling</span>
                  <span>{counts.loyalty} Loyalty</span>
                  <span>{counts.guestExperience} Guest experience</span>
                </span>
              </span>
            </Link>
          );
        })}
        <Link to={listings.recovery.path} className="context-card is-recovery" data-testid="context-recovery">
          <OpenArrow />
          <span className="context-count">{countForListing("recovery", actions)}</span>
          <span className="context-label">{listings.recovery.title}</span>
          <span className="context-unit">{listings.recovery.unit}</span>
        </Link>
      </section>

      <div className="board">
        <section className="panel" aria-labelledby="priority-heading">
          <div className="panel-head">
            <h2 id="priority-heading">Incidents that need to be resolved</h2>
            <p>Follow up on these incidents.</p>
          </div>
          <ol className="priority board-scroll" data-testid="priority-list">
            {incidents.map((action) => {
              const guest = guestById(action.guestId);
              const listing = listings[action.listing];
              return (
                <li key={action.id}>
                  <Link
                    to={`${listing.path}?action=${action.id}`}
                    className="priority-row"
                    data-testid="priority-action"
                    data-severity={action.severity ?? "none"}
                  >
                    <span className={`severity severity-${action.severity ?? "none"}`}>
                      {action.severity}
                    </span>
                    <span className="priority-copy">
                      <span className="priority-label">{action.label}</span>
                      <span className="priority-meta">
                        {guest.name} · Room {guest.room}
                      </span>
                    </span>
                    <span className={action.status === "pending" ? "incident-status" : "incident-status is-advanced"}>
                      {action.status === "notified" ? "Notified" : action.status === "solved" ? "Solved" : "Pending"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="board-side">
          <section className="table-card" aria-labelledby="returning-heading" data-testid="vip-returning">
            <header className="table-card-head">
              <h2 id="returning-heading">VIP and returning</h2>
            </header>
            <ul className="vip-list board-scroll">
              {returningGuests().map((guest) => (
                <li key={guest.id}>
                  <Link to={`/guests/${guest.id}`} className="vip-row">
                    <span className="vip-copy">
                      <span className="vip-name">{guest.name}</span>
                      <span className="vip-meta">{stayLine(guest)}</span>
                    </span>
                    <span className={`guest-badge ${guest.vip ? "is-vip" : "is-returning"}`}>
                      {guest.vip ? "VIP" : "Returning"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="results" aria-label="Milestones achieved in the last 7 days">
            <header className="results-head">
              <h2>Milestones achieved in the last 7 days</h2>
            </header>
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
          </section>
        </div>
      </div>
    </div>
  );
}
