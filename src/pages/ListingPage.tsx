import { Fragment, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  actionsForListing,
  compareActions,
  guestById,
  guests,
  listings,
  money,
  shiftDateLabel,
  type ActionStatus,
  type Category,
  type Guest,
  type ListingId,
  type Severity,
  type ShiftAction,
} from "../data/shift";
import { CategoryPill } from "../components/CategoryPill";
import { useShift } from "../state/ShiftState";

const completedTitle = "Sold, Signed up, Notified";

const severityFilters: { id: "all" | Severity; label: string }[] = [
  { id: "all", label: "All" },
  { id: "urgent", label: "Urgent" },
  { id: "normal", label: "Normal" },
  { id: "low", label: "Low" },
];

function label(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function positiveLabel(category: Category): string {
  if (category === "upselling") return "Sold";
  if (category === "loyalty") return "Signed up";
  if (category === "guest-experience") return "Notified";
  return "Solved";
}

function sectionTitle(action: ShiftAction): string {
  if (action.status === "rejected") return "Rejected";
  if (action.status === "solved") return "Solved";
  if (action.status === "confirmed") return "Confirmed with guest";
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

function matchesSeverity(action: ShiftAction, severity: "all" | Severity): boolean {
  return severity === "all" || action.severity === severity;
}

function recoveryRows(actions: ShiftAction[], status: ActionStatus, severity: "all" | Severity): Row[] {
  return actionsForListing("recovery", actions)
    .filter((action) => action.status === status && matchesSeverity(action, severity))
    .map((action) => ({ guest: guestById(action.guestId), action }));
}

function stayIncidentRows(listingId: ListingId, actions: ShiftAction[], status: "pending" | "solved"): Row[] {
  const moment = listings[listingId].moment;
  if (moment !== "check-out" && moment !== "in-house") return [];
  return actions
    .filter((action) => action.category === "recovery" && action.status === status)
    .map((action) => ({ guest: guestById(action.guestId), action }))
    .filter((row) => row.guest.moment === moment)
    .sort((a, b) => compareActions(a.action, b.action));
}

function settledRows(listingId: ListingId, actions: ShiftAction[], status: ActionStatus): Row[] {
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
  if (action.category === "recovery") {
    return (
      <select
        className="status-select"
        aria-label="Mark the status"
        value={action.status}
        onChange={(event) => {
          const next = event.target.value;
          if (next === "pending" || next === "solved" || next === "confirmed") onStatus(action.id, next);
        }}
      >
        <option value="pending">Pending</option>
        <option value="solved">Solved</option>
        <option value="confirmed">Confirmed with guest</option>
      </select>
    );
  }

  if (action.category === "guest-experience") {
    return (
      <select
        className="status-select"
        aria-label="Mark the status"
        value="pending"
        onChange={(event) => {
          if (event.target.value === "done") onStatus(action.id, "done");
        }}
      >
        <option value="pending">Pending</option>
        <option value="done">Notified</option>
      </select>
    );
  }

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
      <option value="rejected">Rejected</option>
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
        <CategoryPill category={action.category} />
      </td>
      <td className="cell-value">
        {action.category === "upselling" && action.value != null ? money.format(action.value) : null}
      </td>
      {isRecovery ? <td>{action.severity ? label(action.severity) : "—"}</td> : null}
      <td>
        {action.category === "recovery" || !settled ? (
          <MarkStatus action={action} onStatus={onStatus} />
        ) : (
          <span className="settled-label">{sectionTitle(action)}</span>
        )}
      </td>
      <td className="cell-mark">
        {action.status === "confirmed" || (settled && action.status === "rejected") ? (
          <OutcomeMark rejected={action.status === "rejected"} />
        ) : settled && action.status === "done" ? (
          <OutcomeMark rejected={false} />
        ) : null}
      </td>
    </tr>
  ));
}

function ListingCard({
  pending,
  groups,
  isRecovery,
  focus,
  onStatus,
  tools,
}: {
  pending: Row[];
  groups: { title: string; rows: Row[] }[];
  isRecovery: boolean;
  focus: string | null;
  onStatus: (id: string, status: ActionStatus) => void;
  tools?: ReactNode;
}) {
  const columnCount = isRecovery ? 8 : 7;
  const hasRows = pending.length + groups.reduce((total, group) => total + group.rows.length, 0) > 0;

  return (
    <section className="table-card" data-testid="listing-open">
      {tools}
      {hasRows ? (
        <table className={isRecovery ? "listing-table is-recovery" : "listing-table"}>
          <colgroup>
            <col className="col-guest" />
            <col className="col-room" />
            <col className="col-action" />
            <col className="col-category" />
            <col className="col-value" />
            {isRecovery ? <col className="col-severity" /> : null}
            <col className="col-status" />
            <col className="col-mark" />
          </colgroup>
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
            {groups.map((group) =>
              group.rows.length > 0 ? (
                <Fragment key={group.title}>
                  <tr className="listing-group">
                    <th colSpan={columnCount}>{group.title}</th>
                  </tr>
                  <ListingRows rows={group.rows} isRecovery={isRecovery} focus={focus} settled onStatus={onStatus} />
                </Fragment>
              ) : null,
            )}
          </tbody>
        </table>
      ) : (
        <p className="listing-empty">{isRecovery ? "No incidents." : "No pending actions."}</p>
      )}
    </section>
  );
}

function IncidentDrawer({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (incident: { guestId: string; label: string; severity: Severity }) => void;
}) {
  const [query, setQuery] = useState("");
  const [guestId, setGuestId] = useState("");
  const [labelText, setLabelText] = useState("");
  const [severity, setSeverity] = useState<Severity>("normal");

  const guest = guests.find((item) => item.id === guestId);
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? guests
        .filter((item) => item.name.toLowerCase().includes(needle) || item.room.includes(needle))
        .slice(0, 6)
    : [];

  function save() {
    if (!guest || !labelText.trim()) return;
    onAdd({ guestId: guest.id, label: labelText, severity });
    onClose();
  }

  return (
    <div className="drawer-root">
      <button type="button" className="drawer-backdrop" aria-label="Close" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-labelledby="incident-title">
        <header className="drawer-head">
          <h2 id="incident-title">Open incident</h2>
          <button type="button" className="incident-cancel" onClick={onClose}>
            Cancel
          </button>
        </header>
        <label className="drawer-field">
          Guest
          <input
            className="incident-input"
            aria-label="Search guests"
            placeholder="Search by name or room"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setGuestId("");
            }}
          />
        </label>
        {!guest && matches.length > 0 ? (
          <ul className="suggest">
            {matches.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setGuestId(item.id);
                    setQuery(item.name);
                  }}
                >
                  {item.name}
                  <span>Room {item.room}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <label className="drawer-field">
          Room
          <input className="incident-input" readOnly value={guest?.room ?? ""} placeholder="Room" />
        </label>
        <label className="drawer-field">
          Incident
          <input
            className="incident-input"
            aria-label="Incident"
            placeholder="What happened"
            value={labelText}
            onChange={(event) => setLabelText(event.target.value)}
          />
        </label>
        <label className="drawer-field">
          Severity
          <select
            className="status-select"
            aria-label="Severity"
            value={severity}
            onChange={(event) => setSeverity(event.target.value as Severity)}
          >
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </label>
        <button type="button" className="add-incident" disabled={!guest || !labelText.trim()} onClick={save}>
          Open incident
        </button>
      </aside>
    </div>
  );
}

export function ListingPage({ listingId }: { listingId: ListingId }) {
  const { actions, setActionStatus, addIncident } = useShift();
  const [params] = useSearchParams();
  const [severity, setSeverity] = useState<(typeof severityFilters)[number]["id"]>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const focus = params.get("action");
  const isRecovery = listingId === "recovery";
  const listing = listings[listingId];
  const pending = isRecovery
    ? recoveryRows(actions, "pending", severity)
    : [...openRows(listingId, actions), ...stayIncidentRows(listingId, actions, "pending")].sort((a, b) =>
        compareActions(a.action, b.action),
      );
  const groups = isRecovery
    ? [{ title: "Solved", rows: recoveryRows(actions, "solved", severity) }]
    : [
        { title: completedTitle, rows: settledRows(listingId, actions, "done") },
        { title: "Rejected", rows: settledRows(listingId, actions, "rejected") },
        { title: "Solved", rows: stayIncidentRows(listingId, actions, "solved") },
      ];

  useEffect(() => {
    document.title = `${listing.title} · Guest Experience`;
    if (!focus) return;
    document.getElementById(`action-${focus}`)?.scrollIntoView({ block: "center" });
  }, [focus, listing.title]);

  return (
    <div className="page" data-testid={`listing-${listingId}`}>
      <header className="page-header">
        <h1>
          {listing.title}
          {listingId === "check-ins" ? <span className="listing-date">{shiftDateLabel}</span> : null}
        </h1>
      </header>
      <ListingCard
        pending={pending}
        groups={groups}
        isRecovery={isRecovery}
        focus={focus}
        onStatus={setActionStatus}
        tools={
          isRecovery ? (
            <div className="listing-tools">
              <div className="guest-tags" role="tablist" aria-label="Severity">
                {severityFilters.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={severity === item.id}
                    className={severity === item.id ? "guest-tag is-active" : "guest-tag"}
                    onClick={() => setSeverity(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button type="button" className="add-incident" onClick={() => setDrawerOpen(true)}>
                Open incident
              </button>
            </div>
          ) : undefined
        }
      />
      {isRecovery && drawerOpen ? (
        <IncidentDrawer onClose={() => setDrawerOpen(false)} onAdd={addIncident} />
      ) : null}
    </div>
  );
}
