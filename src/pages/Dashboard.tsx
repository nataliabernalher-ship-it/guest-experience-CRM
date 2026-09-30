import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  categoryLabels,
  countForListing,
  guestById,
  returningGuests,
  isPending,
  last7Days,
  listings,
  momentCategoryCounts,
  money,
  priorityActions,
  shiftDateLabel,
  type ListingId,
} from "../data/shift";
import { useShift } from "../state/ShiftState";

const stayListings: ListingId[] = ["check-ins", "check-outs", "in-house"];

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function Dashboard() {
  useEffect(() => {
    document.title = "Guest Experience";
  }, []);

  const { actions } = useShift();
  const pending = actions.filter(isPending);
  const top = priorityActions(pending);

  return (
    <div className="page" data-testid="dashboard">
      <header className="page-header">
        <p className="eyebrow">Today&apos;s shift</p>
        <h1>{greeting(new Date())}</h1>
        <p className="lede">{shiftDateLabel}</p>
      </header>

      <section className="context" aria-label="Shift context">
        {stayListings.map((id) => {
          const listing = listings[id];
          const counts = momentCategoryCounts(id, pending);
          return (
            <Link
              key={id}
              to={listing.path}
              className="context-card"
              data-testid={`context-${id}`}
            >
              <span className="context-count">{countForListing(id, actions)}</span>
              <span className="context-label">{listing.title}</span>
              <span className="context-breakdown">
                <span>{counts.upselling} Upselling</span>
                <span>{counts.loyalty} Loyalty</span>
                <span>{counts.guestExperience} Guest experience</span>
              </span>
            </Link>
          );
        })}
        <Link to={listings.recovery.path} className="context-card is-recovery" data-testid="context-recovery">
          <span className="context-count">{countForListing("recovery", pending)}</span>
          <span className="context-label">{listings.recovery.title}</span>
          <span className="context-unit">{listings.recovery.unit}</span>
        </Link>
      </section>

      <div className="board">
        <section className="panel" aria-labelledby="priority-heading">
          <div className="panel-head">
            <h2 id="priority-heading">Needs your attention</h2>
            <p>Five actions. Open the list to take care of them.</p>
          </div>
          <ol className="priority" data-testid="priority-list">
            {top.map((action) => {
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
                      {action.severity ?? categoryLabels[action.category]}
                    </span>
                    <span className="priority-copy">
                      <span className="priority-label">{action.label}</span>
                      <span className="priority-meta">
                        {guest.name} · Room {guest.room}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="table-card" aria-labelledby="returning-heading" data-testid="vip-returning">
          <header className="table-card-head">
            <h2 id="returning-heading">VIP and returning</h2>
            <p>Check the profiles of guests visiting us again.</p>
          </header>
          <table className="listing-table">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Room</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {returningGuests().map((guest) => (
                <tr key={guest.id}>
                  <td className="cell-strong">{guest.name}</td>
                  <td>{guest.room}</td>
                  <td className="cell-view">
                    <Link to={`/guests/${guest.id}`}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="results" aria-label="Last 7 days">
        <h2>Last 7 days</h2>
        <div className="result" data-testid="metric-revenue">
          <span className="result-value">{money.format(last7Days.upsellingRevenue)}</span>
          <span className="result-label">Upselling revenue</span>
        </div>
        <div className="result" data-testid="metric-loyalty">
          <span className="result-value">{last7Days.loyaltySignUps}</span>
          <span className="result-label">Loyalty sign-ups</span>
        </div>
        <div className="result" data-testid="metric-pampered">
          <span className="result-value">{last7Days.guestsPampered}</span>
          <span className="result-label">Guests pampered</span>
        </div>
      </section>
    </div>
  );
}
