import { Fragment, useEffect, useMemo, useState } from "react";
import {
  guestById,
  money,
  type ActionStatus,
  type Category,
  type Guest,
  type ShiftAction,
} from "../data/shift";
import { CategoryPill } from "../components/CategoryPill";
import { OpportunityDetailModal } from "../components/OpportunityDetailModal";
import { OpportunityDrawer } from "../components/OpportunityDrawer";
import { useShift } from "../state/ShiftState";

const typeFilters: { id: "all" | Exclude<Category, "recovery">; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upselling", label: "Upselling" },
  { id: "guest-experience", label: "Special amenities" },
];

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function saleCell(action: ShiftAction, amount: number | null) {
  if (action.category !== "upselling" || amount == null) return <span className="guest-none">–</span>;
  return money.format(amount);
}

function positiveLabel(category: Category): string {
  if (category === "upselling") return "Sold";
  if (category === "loyalty") return "Signed up";
  if (category === "guest-experience") return "Notified";
  return "Done";
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

type OpportunityRow = { guest: Guest; action: ShiftAction };
type OpportunityItem =
  | { kind: "single"; guest: Guest; action: ShiftAction }
  | { kind: "group"; guest: Guest; actions: ShiftAction[] };

function groupOpportunityRows(rows: OpportunityRow[]): OpportunityItem[] {
  const items: OpportunityItem[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.guest.id)) continue;
    seen.add(row.guest.id);
    const actions = rows.filter((item) => item.guest.id === row.guest.id).map((item) => item.action);
    if (actions.length <= 1) items.push({ kind: "single", guest: row.guest, action: actions[0] ?? row.action });
    else items.push({ kind: "group", guest: row.guest, actions });
  }
  return items;
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

function OpportunityDetailCells({
  guest,
  action,
  onStatus,
}: {
  guest: Guest;
  action: ShiftAction;
  onStatus: (id: string, status: ActionStatus) => void;
}) {
  return (
    <>
      <td className="cell-strong">{action.label}</td>
      <td>
        <CategoryPill category={action.category} />
      </td>
      <td>{action.category === "upselling" ? guest.partySize : <span className="guest-none">–</span>}</td>
      <td>{saleCell(action, action.value ?? null)}</td>
      <td>
        {saleCell(
          action,
          action.category === "upselling" && action.value != null ? guest.partySize * action.value : null,
        )}
      </td>
      <td onClick={(event) => event.stopPropagation()}>
        <OpportunityOutcomeButtons action={action} onStatus={onStatus} />
      </td>
      <td className="cell-mark">
        {action.status === "rejected" ? (
          <OutcomeMark rejected />
        ) : action.status === "done" ? (
          <OutcomeMark rejected={false} />
        ) : null}
      </td>
    </>
  );
}

function OpportunityRows({
  rows,
  sectionKey,
  expandedGuests,
  onToggleGuest,
  onStatus,
  onOpenOpportunity,
}: {
  rows: OpportunityRow[];
  sectionKey: string;
  expandedGuests: Set<string>;
  onToggleGuest: (key: string) => void;
  onStatus: (id: string, status: ActionStatus) => void;
  onOpenOpportunity: (action: ShiftAction) => void;
}) {
  return groupOpportunityRows(rows).map((item) => {
    if (item.kind === "single") {
      const { guest, action } = item;
      return (
        <tr key={action.id} className="is-opportunity-row" onClick={() => onOpenOpportunity(action)}>
          <td>
            <span className="guest-cell">
              <span className="avatar" aria-hidden="true">
                {initials(guest.name)}
              </span>
              <span className="cell-strong">{guest.name}</span>
            </span>
          </td>
          <td>{guest.room}</td>
          <OpportunityDetailCells guest={guest} action={action} onStatus={onStatus} />
        </tr>
      );
    }

    const { guest, actions } = item;
    const [first, ...rest] = actions;
    const expandKey = `${sectionKey}:${guest.id}`;
    const open = expandedGuests.has(expandKey);

    return (
      <Fragment key={`${sectionKey}-group-${guest.id}`}>
        <tr
          className={["is-opportunity-group", "is-opportunity-row", open ? "is-open" : null]
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
          <OpportunityDetailCells guest={guest} action={first} onStatus={onStatus} />
        </tr>
        {open
          ? rest.map((action) => (
              <tr
                key={action.id}
                className="is-opportunity-child is-opportunity-row"
                onClick={() => onOpenOpportunity(action)}
              >
                <td />
                <td>{guest.room}</td>
                <OpportunityDetailCells guest={guest} action={action} onStatus={onStatus} />
              </tr>
            ))
          : null}
      </Fragment>
    );
  });
}

export function OpportunitiesPage() {
  const { actions, addOpportunity, setActionStatus } = useShift();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<(typeof typeFilters)[number]["id"]>("all");
  const [expandedGuests, setExpandedGuests] = useState<Set<string>>(() => new Set());
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const opportunities = useMemo(
    () =>
      actions
        .filter((action) => action.listing === "check-ins" && action.category !== "recovery")
        .filter((action) => type === "all" || action.category === type)
        .map((action) => ({ action, guest: guestById(action.guestId) }))
        .sort((a, b) => a.guest.name.localeCompare(b.guest.name) || a.action.label.localeCompare(b.action.label)),
    [actions, type],
  );
  const hasRows = opportunities.length > 0;
  const selectedOpportunity =
    selectedOpportunityId == null
      ? null
      : actions.find((action) => action.id === selectedOpportunityId && action.category !== "recovery") ?? null;

  useEffect(() => {
    document.title = "Opportunities · Guest Experience";
  }, []);

  function toggleGuest(key: string) {
    setExpandedGuests((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="page" data-testid="opportunities">
      <header className="page-header">
        <h1>Opportunities</h1>
        <p className="lede">These are the opportunities that still need to be actioned.</p>
      </header>
      <section className="table-card">
        <div className="listing-tools">
          <div className="guest-tags" role="tablist" aria-label="Opportunity type">
            {typeFilters.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={type === item.id}
                className={type === item.id ? "guest-tag is-active" : "guest-tag"}
                onClick={() => setType(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button type="button" className="add-incident" onClick={() => setOpen(true)}>
            Add opportunity
          </button>
        </div>
        <table className="listing-table is-opportunities">
          <colgroup>
            <col className="col-guest" />
            <col className="col-room" />
            <col className="col-action" />
            <col className="col-category" />
            <col className="col-people" />
            <col className="col-unit" />
            <col className="col-total" />
            <col className="col-status" />
            <col className="col-mark" />
          </colgroup>
          <thead>
            <tr>
              <th>Guest</th>
              <th>Room</th>
              <th>Opportunity</th>
              <th>Category</th>
              <th>People</th>
              <th>Unit value</th>
              <th>Total</th>
              <th>Mark the status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {hasRows ? (
              <OpportunityRows
                rows={opportunities}
                sectionKey="all"
                expandedGuests={expandedGuests}
                onToggleGuest={toggleGuest}
                onStatus={setActionStatus}
                onOpenOpportunity={(action) => setSelectedOpportunityId(action.id)}
              />
            ) : (
              <tr>
                <td className="guest-empty" colSpan={9}>
                  No opportunities.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
      {open ? <OpportunityDrawer onClose={() => setOpen(false)} onAdd={addOpportunity} /> : null}
      {selectedOpportunity ? (
        <OpportunityDetailModal action={selectedOpportunity} onClose={() => setSelectedOpportunityId(null)} />
      ) : null}
    </div>
  );
}
