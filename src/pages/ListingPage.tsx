import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  actionsForListing,
  categoryLabels,
  guestById,
  listings,
  shiftDateLabel,
  type ActionStatus,
  type Category,
  type Guest,
  type ListingId,
  type ShiftAction,
} from "../data/shift";
import { useShift } from "../state/ShiftState";

const completedTitle = "Sold, Signed up, Done";

function label(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function positiveLabel(category: Category): string {
  if (category === "upselling") return "Sold";
  if (category === "loyalty") return "Signed up";
  if (category === "guest-experience") return "Done";
  return "Start";
}

function sectionTitle(action: ShiftAction): string {
  if (action.status === "rejected") return "Rejected";
  if (action.category === "recovery") return "In progress";
  return positiveLabel(action.category);
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

interface Row {
  guest: Guest;
  action: ShiftAction;
}

function openRows(listingId: ListingId, actions: ShiftAction[]): Row[] {
  return actionsForListing(listingId, actions)
    .filter((action) => action.status === "pending")
    .map((action) => ({ guest: guestById(action.guestId), action }));
}

function settledRows(listingId: ListingId, actions: ShiftAction[], status: "done" | "rejected"): Row[] {
  return actionsForListing(listingId, actions)
    .filter((action) => action.status === status)
    .map((action) => ({ guest: guestById(action.guestId), action }));
}

function OutcomeMark({ rejected }: { rejected: boolean }) {
  return (
    <span className={rejected ? "mark mark-rejected" : "mark mark-done"} role="img" aria-label={rejected ? "Rejected" : "Done"}>
      {rejected ? (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="10" />
          <path d="M6.5 6.5 13.5 13.5 M13.5 6.5 6.5 13.5" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="10" />
          <path d="M5.5 10.2 8.4 13.1 14.5 6.8" />
        </svg>
      )}
    </span>
  );
}

function MarkButtons({
  action,
  onStatus,
}: {
  action: ShiftAction;
  onStatus: (id: string, status: ActionStatus) => void;
}) {
  return (
    <div className="mark-buttons">
      <button
        type="button"
        className={`mark-button mark-button-${action.category}`}
        onClick={() => onStatus(action.id, "done")}
      >
        {positiveLabel(action.category)}
      </button>
      {action.category === "recovery" ? null : (
        <button type="button" className="mark-button mark-button-rejected" onClick={() => onStatus(action.id, "rejected")}>
          Rejected
        </button>
      )}
    </div>
  );
}

function ListingBlock({
  title,
  date,
  heading,
  rows,
  isRecovery,
  focus,
  settled,
  onStatus,
}: {
  title: string;
  date?: string;
  heading: "h1" | "h2";
  rows: Row[];
  isRecovery: boolean;
  focus: string | null;
  settled?: boolean;
  onStatus: (id: string, status: ActionStatus) => void;
}) {
  const Heading = heading;
  return (
    <section className={settled ? "table-card is-settled" : "table-card"} data-testid={settled ? `listing-${title}` : "listing-open"}>
      <header className="table-card-head">
        <Heading>
          {title}
          {date ? <span className="listing-date">{date}</span> : null}
        </Heading>
      </header>
      {rows.length === 0 ? (
        <p className="listing-empty">No pending actions.</p>
      ) : (
        <table className="listing-table">
          <thead>
            <tr>
              <th>Guest</th>
              <th>Room</th>
              <th>Action</th>
              <th>Category</th>
              {isRecovery ? <th>Severity</th> : null}
              <th>Mark the status</th>
              {settled ? <th /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ guest, action }) => (
              <tr
                key={action.id}
                id={`action-${action.id}`}
                className={focus === action.id ? "is-focused" : undefined}
              >
                <td>
                  <span className="guest-cell">
                    <span className="avatar" aria-hidden="true">
                      {initials(guest.name)}
                    </span>
                    <span className="cell-strong">{guest.name}</span>
                  </span>
                </td>
                <td>{guest.room}</td>
                <td className="cell-strong">{action.label}</td>
                <td>
                  <span className="category-pill" data-category={action.category}>
                    {categoryLabels[action.category]}
                  </span>
                </td>
                {isRecovery ? <td>{action.severity ? label(action.severity) : "—"}</td> : null}
                <td>
                  {settled ? (
                    <span className="settled-label">{sectionTitle(action)}</span>
                  ) : (
                    <MarkButtons action={action} onStatus={onStatus} />
                  )}
                </td>
                {settled ? (
                  <td className="cell-mark">
                    <OutcomeMark rejected={action.status === "rejected"} />
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export function ListingPage({ listingId }: { listingId: ListingId }) {
  const { actions, setActionStatus } = useShift();
  const [params] = useSearchParams();
  const focus = params.get("action");
  const isRecovery = listingId === "recovery";
  const listing = listings[listingId];
  const pending = openRows(listingId, actions);
  const completed = settledRows(listingId, actions, "done");
  const rejected = settledRows(listingId, actions, "rejected");

  useEffect(() => {
    document.title = `${listing.title} · Guest Experience`;
    if (!focus) return;
    document.getElementById(`action-${focus}`)?.scrollIntoView({ block: "center" });
  }, [focus, listing.title]);

  return (
    <div className="page" data-testid={`listing-${listingId}`}>
      <ListingBlock
        title={listing.title}
        date={listingId === "check-ins" ? shiftDateLabel : undefined}
        heading="h1"
        rows={pending}
        isRecovery={isRecovery}
        focus={focus}
        onStatus={setActionStatus}
      />
      {completed.length > 0 ? (
        <ListingBlock
          title={isRecovery ? "In progress" : completedTitle}
          heading="h2"
          rows={completed}
          isRecovery={isRecovery}
          focus={focus}
          settled
          onStatus={setActionStatus}
        />
      ) : null}
      {rejected.length > 0 ? (
        <ListingBlock
          title="Rejected"
          heading="h2"
          rows={rejected}
          isRecovery={isRecovery}
          focus={focus}
          settled
          onStatus={setActionStatus}
        />
      ) : null}
    </div>
  );
}
