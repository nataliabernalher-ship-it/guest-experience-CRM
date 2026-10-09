import { Fragment, useEffect, useState, type ReactNode } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import {
  actionsForListing,
  compareActions,
  formatIncidentWhen,
  guestById,
  guests,
  listingForMoment,
  listings,
  money,
  opportunityMomentTabs,
  type ActionStatus,
  type Category,
  type Guest,
  type ListingId,
  type Severity,
  type ShiftAction,
} from "../data/shift";
import { CategoryPill } from "../components/CategoryPill";
import { EmptyState, ErrorState, LoadingState } from "../components/ViewState";
import { IncidentDetailModal } from "../components/IncidentDetailModal";
import { OpportunityDetailModal } from "../components/OpportunityDetailModal";
import { OpportunityDrawer } from "../components/OpportunityDrawer";
import { useViewLoad } from "../hooks/useViewLoad";
import { useShift } from "../state/ShiftState";

const severityFilters: { id: "all" | Severity; label: string }[] = [
  { id: "all", label: "All" },
  { id: "urgent", label: "Urgent" },
  { id: "normal", label: "Normal" },
  { id: "low", label: "Low" },
];

const categoryFilters: { id: "all" | Exclude<Category, "recovery">; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upselling", label: "Upselling" },
  { id: "guest-experience", label: "Special amenities" },
  { id: "loyalty", label: "Loyalty" },
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

type ListingItem =
  | { kind: "single"; guest: Guest; action: ShiftAction }
  | { kind: "group"; guest: Guest; actions: ShiftAction[] };

function groupListingRows(rows: Row[]): ListingItem[] {
  const items: ListingItem[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (row.action.category === "recovery") {
      items.push({ kind: "single", guest: row.guest, action: row.action });
      continue;
    }
    if (seen.has(row.guest.id)) continue;
    seen.add(row.guest.id);
    const grouped = rows
      .filter((item) => item.guest.id === row.guest.id && item.action.category !== "recovery")
      .map((item) => item.action);
    if (grouped.length === 0) {
      items.push({ kind: "single", guest: row.guest, action: row.action });
    } else if (grouped.length === 1) {
      items.push({ kind: "single", guest: row.guest, action: grouped[0] });
    } else {
      items.push({ kind: "group", guest: row.guest, actions: grouped });
    }
  }

  return items;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={open ? "guest-chevron is-open" : "guest-chevron"}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden="true"
    >
      <path
        d="M3.5 5.25 7 8.75l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function opportunityRows(listingId: ListingId, actions: ShiftAction[]): Row[] {
  return actionsForListing(listingId, actions)
    .filter((action) => action.category !== "recovery")
    .map((action) => ({ guest: guestById(action.guestId), action }));
}

function matchesSeverity(action: ShiftAction, severity: "all" | Severity): boolean {
  return severity === "all" || action.severity === severity;
}

function matchesCategory(action: ShiftAction, category: "all" | Exclude<Category, "recovery">): boolean {
  return category === "all" || action.category === category;
}

function recoveryRows(actions: ShiftAction[], severity: "all" | Severity): Row[] {
  return actionsForListing("recovery", actions)
    .filter((action) => matchesSeverity(action, severity))
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

function RecoveryMarkStatus({
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
      value={action.status}
      onChange={(event) => {
        const next = event.target.value;
        if (next === "pending" || next === "notified" || next === "solved" || next === "confirmed") onStatus(action.id, next);
      }}
    >
      <option value="pending">Pending</option>
      <option value="notified">Notified</option>
      <option value="solved">Solved</option>
      <option value="confirmed">Confirmed with guest</option>
    </select>
  );
}

function OpportunityOutcomeButtons({
  action,
  onStatus,
}: {
  action: ShiftAction;
  onStatus: (id: string, status: ActionStatus) => void;
}) {
  const positive = positiveLabel(action.category);
  const isDone = action.status === "done";
  const isRejected = action.status === "rejected";

  return (
    <div className="outcome-buttons" role="group" aria-label="Guest response">
      <button
        type="button"
        className={isDone ? "outcome-btn is-positive is-selected" : "outcome-btn is-positive"}
        aria-pressed={isDone}
        onClick={() => onStatus(action.id, isDone ? "pending" : "done")}
      >
        {positive}
      </button>
      {action.category === "guest-experience" ? null : (
        <button
          type="button"
          className={isRejected ? "outcome-btn is-negative is-selected" : "outcome-btn is-negative"}
          aria-pressed={isRejected}
          onClick={() => onStatus(action.id, isRejected ? "pending" : "rejected")}
        >
          Rejected
        </button>
      )}
    </div>
  );
}

function OpportunityActionCells({
  action,
  isRecovery,
  onStatus,
}: {
  action: ShiftAction;
  isRecovery: boolean;
  onStatus: (id: string, status: ActionStatus) => void;
}) {
  return (
    <>
      <td className="cell-strong">{action.label}</td>
      <td>
        <CategoryPill category={action.category} />
      </td>
      {isRecovery ? (
        <td className="cell-created">{formatIncidentWhen(action.createdAt)}</td>
      ) : (
        <td className="cell-value">
          {action.category === "upselling" && action.value != null ? money.format(action.value) : null}
        </td>
      )}
      {isRecovery ? <td>{action.severity ? label(action.severity) : "—"}</td> : null}
      <td onClick={(event) => event.stopPropagation()}>
        {action.category === "recovery" ? (
          <RecoveryMarkStatus action={action} onStatus={onStatus} />
        ) : (
          <OpportunityOutcomeButtons action={action} onStatus={onStatus} />
        )}
      </td>
      <td className="cell-mark">
        {action.category === "recovery" && action.status === "confirmed" ? (
          <OutcomeMark rejected={false} />
        ) : action.category !== "recovery" && action.status === "rejected" ? (
          <OutcomeMark rejected />
        ) : action.category !== "recovery" && action.status === "done" ? (
          <OutcomeMark rejected={false} />
        ) : null}
      </td>
    </>
  );
}

function ListingRows({
  rows,
  isRecovery,
  focus,
  settled,
  sectionKey,
  expandedGuests,
  onToggleGuest,
  onStatus,
  onOpenIncident,
  onOpenOpportunity,
}: {
  rows: Row[];
  isRecovery: boolean;
  focus: string | null;
  settled?: boolean;
  sectionKey: string;
  expandedGuests: Set<string>;
  onToggleGuest: (guestId: string) => void;
  onStatus: (id: string, status: ActionStatus) => void;
  onOpenIncident: (action: ShiftAction) => void;
  onOpenOpportunity: (action: ShiftAction) => void;
}) {
  const items = groupListingRows(rows);

  return items.map((item) => {
    if (item.kind === "single") {
      const { guest, action } = item;
      return (
        <tr
          key={action.id}
          id={`action-${action.id}`}
          className={[
            settled ? "is-settled" : null,
            focus === action.id ? "is-focused" : null,
            action.category === "recovery" ? "is-incident-row" : "is-opportunity-row",
          ]
            .filter(Boolean)
            .join(" ") || undefined}
          onClick={() => {
            if (action.category === "recovery") onOpenIncident(action);
            else onOpenOpportunity(action);
          }}
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
          <OpportunityActionCells action={action} isRecovery={isRecovery} onStatus={onStatus} />
        </tr>
      );
    }

    const { guest, actions } = item;
    const [first, ...rest] = actions;
    const expandKey = `${sectionKey}:${guest.id}`;
    const open = expandedGuests.has(expandKey);
    const focused = actions.some((action) => action.id === focus);

    return (
      <Fragment key={`${sectionKey}-group-${guest.id}`}>
        <tr
          id={`action-${first.id}`}
          className={[
            "is-opportunity-group",
            "is-opportunity-row",
            settled ? "is-settled" : null,
            focus === first.id || focused ? "is-focused" : null,
            open ? "is-open" : null,
          ]
            .filter(Boolean)
            .join(" ") || undefined}
          onClick={() => onOpenOpportunity(first)}
        >
          <td>
            <span className="guest-cell">
              <span className="avatar" aria-hidden="true">
                {initials(guest.name)}
              </span>
              <span className="cell-strong">{guest.name}</span>
              <button
                type="button"
                className="guest-accordion-toggle"
                aria-expanded={open}
                aria-label={open ? `Hide opportunities for ${guest.name}` : `Show opportunities for ${guest.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleGuest(expandKey);
                }}
              >
                <ChevronIcon open={open} />
              </button>
            </span>
          </td>
          <td>{guest.room}</td>
          <OpportunityActionCells action={first} isRecovery={isRecovery} onStatus={onStatus} />
        </tr>
        {open
          ? rest.map((action) => (
              <tr
                key={action.id}
                id={`action-${action.id}`}
                className={[
                  "is-opportunity-child",
                  "is-opportunity-row",
                  settled ? "is-settled" : null,
                  focus === action.id ? "is-focused" : null,
                ]
                  .filter(Boolean)
                  .join(" ") || undefined}
                onClick={() => onOpenOpportunity(action)}
              >
                <td />
                <td>{guest.room}</td>
                <OpportunityActionCells action={action} isRecovery={isRecovery} onStatus={onStatus} />
              </tr>
            ))
          : null}
      </Fragment>
    );
  });
}

function ListingCard({
  pending,
  groups,
  isRecovery,
  focus,
  onStatus,
  onOpenIncident,
  onOpenOpportunity,
  tools,
}: {
  pending: Row[];
  groups: { title: string; rows: Row[] }[];
  isRecovery: boolean;
  focus: string | null;
  onStatus: (id: string, status: ActionStatus) => void;
  onOpenIncident: (action: ShiftAction) => void;
  onOpenOpportunity: (action: ShiftAction) => void;
  tools?: ReactNode;
}) {
  const [params] = useSearchParams();
  const { status, retry } = useViewLoad(`${isRecovery ? "recovery" : "opportunities"}-${params.toString()}`);
  const [expandedGuests, setExpandedGuests] = useState<Set<string>>(() => new Set());
  const columnCount = isRecovery ? 8 : 7;
  const hasRows = pending.length + groups.reduce((total, group) => total + group.rows.length, 0) > 0;

  useEffect(() => {
    if (!focus) return;
    const allRows = [...pending, ...groups.flatMap((group) => group.rows)];
    const focused = allRows.find((row) => row.action.id === focus && row.action.category !== "recovery");
    if (!focused) return;
    const siblings = allRows.filter(
      (row) => row.guest.id === focused.guest.id && row.action.category !== "recovery",
    );
    if (siblings.length < 2) return;
    const pendingHas = pending.some((row) => row.action.id === focus);
    const section = pendingHas
      ? "pending"
      : (groups.find((group) => group.rows.some((row) => row.action.id === focus))?.title ?? "pending");
    const key = `${section}:${focused.guest.id}`;
    setExpandedGuests((current) => {
      if (current.has(key)) return current;
      const next = new Set(current);
      next.add(key);
      return next;
    });
  }, [focus, pending, groups]);

  function toggleGuest(key: string) {
    setExpandedGuests((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <section className="table-card" data-testid="listing-open">
      {tools}
      {status === "loading" ? (
        <LoadingState
          title={isRecovery ? "Loading incidents" : "Loading opportunities"}
          description={
            isRecovery
              ? "We’re fetching open incidents for this view. This usually takes a moment."
              : "We’re fetching opportunities for this stay moment. This usually takes a moment."
          }
        />
      ) : status === "error" ? (
        <ErrorState
          title={isRecovery ? "Couldn’t load incidents" : "Couldn’t load opportunities"}
          description="The list didn’t load. Try again, or change the filters and reload."
          action={
            <button type="button" className="add-incident" onClick={retry}>
              Try again
            </button>
          }
        />
      ) : hasRows ? (
        <table className={isRecovery ? "listing-table is-recovery" : "listing-table"}>
          <colgroup>
            <col className="col-guest" />
            <col className="col-room" />
            <col className="col-action" />
            <col className="col-category" />
            {isRecovery ? <col className="col-created" /> : <col className="col-value" />}
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
              {isRecovery ? <th>Created</th> : <th>Value</th>}
              {isRecovery ? <th>Severity</th> : null}
              <th>Mark the status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <ListingRows
              rows={pending}
              isRecovery={isRecovery}
              focus={focus}
              sectionKey="pending"
              expandedGuests={expandedGuests}
              onToggleGuest={toggleGuest}
              onStatus={onStatus}
              onOpenIncident={onOpenIncident}
              onOpenOpportunity={onOpenOpportunity}
            />
            {groups.map((group) =>
              group.rows.length > 0 ? (
                <Fragment key={group.title}>
                  <tr className="listing-group">
                    <th colSpan={columnCount}>{group.title}</th>
                  </tr>
                  <ListingRows
                    rows={group.rows}
                    isRecovery={isRecovery}
                    focus={focus}
                    settled
                    sectionKey={group.title}
                    expandedGuests={expandedGuests}
                    onToggleGuest={toggleGuest}
                    onStatus={onStatus}
                    onOpenIncident={onOpenIncident}
                    onOpenOpportunity={onOpenOpportunity}
                  />
                </Fragment>
              ) : null,
            )}
          </tbody>
        </table>
      ) : (
        <EmptyState
          title={isRecovery ? "No incidents to show" : "No opportunities to show"}
          description={
            isRecovery
              ? "There are no incidents for the current filters. Clear the severity filter or add a new incident from Recovery."
              : "There are no opportunities for this moment and filter. Switch stay moment, clear filters, or add a new opportunity."
          }
          action={
            isRecovery ? undefined : (
              <NavLink to="/opportunities/check-ins" className="view-all">
                Go to check-ins
              </NavLink>
            )
          }
        />
      )}
    </section>
  );
}

function IncidentDrawer({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (incident: { guestId: string; label: string; description: string; severity: Severity }) => void;
}) {
  const [query, setQuery] = useState("");
  const [guestId, setGuestId] = useState("");
  const [labelText, setLabelText] = useState("");
  const [description, setDescription] = useState("");
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
    onAdd({ guestId: guest.id, label: labelText, description, severity });
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
          Title
          <input
            className="incident-input"
            aria-label="Incident title"
            placeholder="Short title"
            value={labelText}
            onChange={(event) => setLabelText(event.target.value)}
          />
        </label>
        <label className="drawer-field">
          Description
          <textarea
            className="incident-input is-area"
            aria-label="Incident description"
            placeholder="What happened"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
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
  const navigate = useNavigate();
  const { actions, setActionStatus, addIncident, addOpportunity } = useShift();
  const [params] = useSearchParams();
  const [severity, setSeverity] = useState<(typeof severityFilters)[number]["id"]>("all");
  const [category, setCategory] = useState<(typeof categoryFilters)[number]["id"]>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [opportunityDrawerOpen, setOpportunityDrawerOpen] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const focus = params.get("action");
  const isRecovery = listingId === "recovery";
  const listing = listings[listingId];

  function handleAddOpportunity(opportunity: {
    guestId: string;
    category: Exclude<Category, "recovery">;
    label: string;
    value?: number;
    description?: string;
  }) {
    addOpportunity(opportunity);
    setOpportunityDrawerOpen(false);
    setCategory("all");
    const target = listingForMoment(guestById(opportunity.guestId).moment);
    if (target !== listingId) {
      navigate(listings[target].path);
    }
  }
  const pending = isRecovery
    ? recoveryRows(actions, severity)
    : opportunityRows(listingId, actions)
        .filter(({ action }) => matchesCategory(action, category))
        .sort((a, b) => compareActions(a.action, b.action));
  const groups: { title: string; rows: Row[] }[] = [];
  const selectedIncident =
    selectedIncidentId == null
      ? null
      : actions.find((action) => action.id === selectedIncidentId && action.category === "recovery") ?? null;
  const selectedOpportunity =
    selectedOpportunityId == null
      ? null
      : actions.find((action) => action.id === selectedOpportunityId && action.category !== "recovery") ?? null;

  const isOpportunityListing = listingId !== "recovery";

  useEffect(() => {
    document.title = `${isOpportunityListing ? "Opportunities" : listing.title} · Guest Experience`;
    if (!focus) return;
    document.getElementById(`action-${focus}`)?.scrollIntoView({ block: "center" });
    const focused = actions.find((action) => action.id === focus);
    if (!focused) return;
    if (focused.category === "recovery") setSelectedIncidentId(focused.id);
    else setSelectedOpportunityId(focused.id);
  }, [focus, listing.title, actions, isOpportunityListing]);

  return (
    <div className="page" data-testid={`listing-${listingId}`}>
      <header className="page-header">
        <h1>{isOpportunityListing ? "Opportunities" : listing.title}</h1>
      </header>
      {isOpportunityListing ? (
        <div className="listing-moment-tabs" role="tablist" aria-label="Stay moment">
          {opportunityMomentTabs.map((item) => (
            <NavLink
              key={item.id}
              to={listings[item.id].path}
              role="tab"
              aria-selected={listingId === item.id}
              className={listingId === item.id ? "listing-moment-tab is-active" : "listing-moment-tab"}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      ) : null}
      <ListingCard
        pending={pending}
        groups={groups}
        isRecovery={isRecovery}
        focus={focus}
        onStatus={setActionStatus}
        onOpenOpportunity={(action) => setSelectedOpportunityId(action.id)}
        onOpenIncident={(action) => setSelectedIncidentId(action.id)}
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
          ) : (
            <div className="listing-tools">
              <div className="guest-tags" role="tablist" aria-label="Category">
                {categoryFilters.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={category === item.id}
                    className={category === item.id ? "guest-tag is-active" : "guest-tag"}
                    onClick={() => setCategory(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button type="button" className="add-incident" onClick={() => setOpportunityDrawerOpen(true)}>
                Add opportunity
              </button>
            </div>
          )
        }
      />
      {isRecovery && drawerOpen ? (
        <IncidentDrawer onClose={() => setDrawerOpen(false)} onAdd={addIncident} />
      ) : null}
      {isOpportunityListing && opportunityDrawerOpen ? (
        <OpportunityDrawer onClose={() => setOpportunityDrawerOpen(false)} onAdd={handleAddOpportunity} />
      ) : null}
      {selectedIncident ? (
        <IncidentDetailModal action={selectedIncident} onClose={() => setSelectedIncidentId(null)} />
      ) : null}
      {selectedOpportunity ? (
        <OpportunityDetailModal action={selectedOpportunity} onClose={() => setSelectedOpportunityId(null)} />
      ) : null}
    </div>
  );
}
