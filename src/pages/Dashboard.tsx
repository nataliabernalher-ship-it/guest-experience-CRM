import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  compareActions,
  countForListing,
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
import { ShiftCorner } from "../components/ShiftCorner";
import { useShift } from "../state/ShiftState";

const stayListings = ["check-ins", "in-house", "check-outs"] as const;

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
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

function opportunityForGuest(guestId: string, source: ShiftAction[]): ShiftAction | undefined {
  const forGuest = source.filter(
    (action) => action.guestId === guestId && action.listing === "check-ins" && action.category !== "recovery",
  );
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
  useEffect(() => {
    document.title = "Guest Experience";
  }, []);

  const { actions } = useShift();
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const recoveryCount = countForListing("recovery", actions);
  const checkInGuests = guests.filter((guest) => guest.moment === "check-in");
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

  return (
    <div className="page" data-testid="dashboard">
      <header className="page-header is-split">
        <div>
          <p className="eyebrow">Today&apos;s shift</p>
          <h1>{greeting(new Date())}</h1>
        </div>
        <ShiftCorner showShift />
      </header>

      <section className="context" aria-label="Shift context">
        {stayListings.map((id) => {
          const listing = listings[id];
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
              <span className="context-total">
                <span className="context-count">{reservations}</span>
                <span className="context-label">{listing.title}</span>
                <span className="context-people">
                  {guests} {guests === 1 ? "guest" : "guests"}
                </span>
              </span>
            </Link>
          );
        })}
        <Link to={listings.recovery.path} className="context-card is-recovery" data-testid="context-recovery">
          <span className="context-total">
            <span className="context-count">{recoveryCount}</span>
            <span className="context-label">{listings.recovery.title}</span>
            <span className="context-people">
              {recoveryCount === 1 ? "1 incident" : `${recoveryCount} incidents`}
            </span>
          </span>
        </Link>
      </section>

      <div className="board">
        <section className="table-card is-checkins" aria-labelledby="checkins-heading" data-testid="today-check-ins">
          <header className="table-card-head">
            <h2 id="checkins-heading">Today&apos;s check-ins</h2>
          </header>
          <ul className="vip-list board-scroll">
            {checkInGuests.map((guest) => {
              const opportunity = opportunityForGuest(guest.id, actions);
              return (
                <li key={guest.id}>
                  <Link to={`/guests/${guest.id}`} className="vip-row is-checkin">
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
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="checkins-foot">
            <Link to={listings["check-ins"].path} className="view-all">
              View all
            </Link>
          </div>
        </section>

        <div className="board-side">
          <section className="panel" aria-labelledby="priority-heading">
            <div className="panel-head">
              <h2 id="priority-heading">Incidents that need to be resolved</h2>
              <p>Follow up on these incidents.</p>
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
      {selectedIncident ? (
        <IncidentDetailModal action={selectedIncident} onClose={() => setSelectedIncidentId(null)} />
      ) : null}
    </div>
  );
}
