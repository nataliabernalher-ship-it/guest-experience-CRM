import { Link, useParams } from "react-router-dom";
import { categoryLabels, guests, listings } from "../data/shift";
import { useShift } from "../state/ShiftState";

const momentLabel = {
  "check-in": "Check-in",
  "check-out": "Check-out",
  "in-house": "In-house",
};

export function GuestProfile() {
  const { guestId } = useParams();
  const { actions } = useShift();
  const guest = guests.find((item) => item.id === guestId);

  if (!guest) {
    return (
      <div className="page">
        <header className="page-header">
          <p className="eyebrow">
            <Link to="/" className="back-link">
              Dashboard
            </Link>
          </p>
          <h1>Guest not found</h1>
        </header>
      </div>
    );
  }

  const guestActions = actions.filter((action) => action.guestId === guest.id);

  return (
    <div className="page" data-testid="guest-profile">
      <header className="page-header">
        <p className="eyebrow">
          <Link to="/" className="back-link">
            Dashboard
          </Link>
        </p>
        <h1>{guest.name}</h1>
        <p className="lede">Room {guest.room}</p>
      </header>
      <section className="profile-facts">
        <div>
          <span>Stay</span>
          <strong>{momentLabel[guest.moment]}</strong>
        </div>
        <div>
          <span>Previous stays</span>
          <strong>{guest.previousStays}</strong>
        </div>
        <div>
          <span>Guest</span>
          <strong>{guest.vip ? "VIP" : guest.previousStays >= 1 ? "Returning" : "First stay"}</strong>
        </div>
      </section>
      <section className="profile-actions">
        <h2>Actions</h2>
        {guestActions.length === 0 ? (
          <p className="profile-empty">No actions on this stay.</p>
        ) : (
          <ul>
            {guestActions.map((action) => (
              <li key={action.id}>
                <span className="cell-strong">{action.label}</span>
                <span className="priority-meta">
                  {" "}
                  · {categoryLabels[action.category]} · {listings[action.listing].title}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
