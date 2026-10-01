import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  actionsForListing,
  categoryLabels,
  guestById,
  listings,
  money,
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

function MarkStatus({
  action,
  onStatus,
}: {
  action: ShiftAction;
  onStatus: (id: string, status: ActionStatus) => void;
}) {
  return (
    <select
      className="status-select"
      aria-label="Mark the status"
      defaultValue=""
      onChange={(event) => {
        const next = event.target.value;
        if (next === "done" || next === "rejected") onStatus(action.id, next);
      }}
    >
      <option value="" disabled>
        Select
      </option>
      <option value="done">{positiveLabel(action.category)}</option>
      {action.category === "recovery" ? null : <option value="rejected">Rejected</option>}
    </select>
  );
}

function ListingRows({
  rows,
  isRecovery,
  focus,
  settled,
  onStatus,
}: {
  rows: Row[];
  isRecovery: boolean;
  focus: string | null;
  settled?: boolean;
  onStatus: (id: string, status: ActionStatus) => void;
}) {
  return rows.map(({ guest, action }) => (
    <tr
      key={action.id}
      id={`action-${action.id}`}
      className={settled ? "is-settled" : focus === action.id ? "is-focused" : undefined}
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
      <td className="cell-value">
        {action.category === "upselling" && action.value != null ? money.format(action.value) : null}
      </td>
      {isRecovery ? <td>{action.severity ? label(action.severity) : "—"}</td> : null}
      <td>
        {settled ? (
          <span className="settled-label">{sectionTitle(action)}</span>
        ) : (
          <MarkStatus action={action} onStatus={onStatus} />
        )}
      </td>
      <td className="cell-mark">{settled ? <OutcomeMark rejected={action.status === "rejected"} /> : null}</td>
    </tr>
  ));
}

function ListingCard({
  title,
  heading,
  pending,
  completed,
  rejected,
  completedLabel,
  isRecovery,
  focus,
  onStatus,
}: {
  title: string;
  heading?: "h1";
  pending: Row[];
  completed: Row[];
  rejected: Row[];
  completedLabel: string;
  isRecovery: boolean;
  focus: string | null;
  onStatus: (id: string, status: ActionStatus) => void;
}) {
  const Heading = heading;
  const columnCount = isRecovery ? 8 : 7;
  const hasRows = pending.length + completed.length + rejected.length > 0;

  return (
    <section className="table-card" data-testid="listing-open">
      {Heading ? (
        <header className="table-card-head">
          <Heading>{title}</Heading>
        </header>
      ) : null}
      {hasRows ? (
        <table className="listing-table">
          <thead>
            <tr>
              <th>Guest</th>
              <th>Room</th>
              <th>Action</th>
              <th>Category</th>
              <th>Value</th>
              {isRecovery ? <th>Severity</th> : null}
              <th>Mark the status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <ListingRows rows={pending} isRecovery={isRecovery} focus={focus} onStatus={onStatus} />
            {completed.length > 0 ? (
              <>
                <tr className="listing-group">
                  <th colSpan={columnCount}>{completedLabel}</th>
                </tr>
                <ListingRows rows={completed} isRecovery={isRecovery} focus={focus} settled onStatus={onStatus} />
              </>
            ) : null}
            {rejected.length > 0 ? (
              <>
                <tr className="listing-group">
                  <th colSpan={columnCount}>Rejected</th>
                </tr>
                <ListingRows rows={rejected} isRecovery={isRecovery} focus={focus} settled onStatus={onStatus} />
              </>
            ) : null}
          </tbody>
        </table>
      ) : (
        <p className="listing-empty">No pending actions.</p>
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
      <header className="page-header">
        {isRecovery ? null : (
          <Link to="/" className="listing-back">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M11 7H3M6 3.5 2.5 7 6 10.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to dashboard
          </Link>
        )}
        <h1>
          {listing.title}
          {listingId === "check-ins" ? <span className="listing-date">{shiftDateLabel}</span> : null}
        </h1>
      </header>
      <ListingCard
        title={listing.title}
        pending={pending}
        completed={completed}
        rejected={rejected}
        completedLabel={isRecovery ? "In progress" : completedTitle}
        isRecovery={isRecovery}
        focus={focus}
        onStatus={setActionStatus}
      />
    </div>
  );
}
