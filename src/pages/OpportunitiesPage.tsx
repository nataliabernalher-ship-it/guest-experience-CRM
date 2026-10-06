import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  experienceTypes,
  guestById,
  guests,
  housekeepingOptions,
  money,
  stayMomentLabel,
  upsellServices,
  type ActionStatus,
  type Category,
  type Guest,
  type ShiftAction,
} from "../data/shift";
import { CategoryPill } from "../components/CategoryPill";
import { useShift } from "../state/ShiftState";

const typeFilters: { id: "all" | Exclude<Category, "recovery">; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upselling", label: "Upselling" },
  { id: "loyalty", label: "Loyalty" },
  { id: "guest-experience", label: "Guest Experience" },
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

function OpportunityRows({
  rows,
  settled,
  onStatus,
}: {
  rows: { guest: Guest; action: ShiftAction }[];
  settled?: boolean;
  onStatus: (id: string, status: ActionStatus) => void;
}) {
  return rows.map(({ guest, action }) => (
    <tr key={action.id} className={settled ? "is-settled" : undefined}>
      <td>
        <Link to={`/guests/${guest.id}`} className="guest-cell guest-link">
          <span className="avatar" aria-hidden="true">
            {initials(guest.name)}
          </span>
          <span className="cell-strong">{guest.name}</span>
        </Link>
      </td>
      <td>{guest.room}</td>
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
      <td>
        {settled ? (
          <span className="settled-label">{action.status === "rejected" ? "Rejected" : positiveLabel(action.category)}</span>
        ) : action.category === "guest-experience" ? (
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
        ) : (
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
        )}
      </td>
      <td className="cell-mark">{settled ? <OutcomeMark rejected={action.status === "rejected"} /> : null}</td>
    </tr>
  ));
}

export function OpportunitiesPage() {
  const { actions, addOpportunity, setActionStatus } = useShift();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<(typeof typeFilters)[number]["id"]>("all");
  const opportunities = useMemo(
    () =>
      actions
        .filter((action) => action.listing === "check-ins" && action.category !== "recovery")
        .filter((action) => type === "all" || action.category === type)
        .map((action) => ({ action, guest: guestById(action.guestId) }))
        .sort((a, b) => a.guest.name.localeCompare(b.guest.name) || a.action.label.localeCompare(b.action.label)),
    [actions, type],
  );
  const pending = opportunities.filter(({ action }) => action.status === "pending");
  const done = opportunities.filter(({ action }) => action.status === "done");
  const rejected = opportunities.filter(({ action }) => action.status === "rejected");
  const hasRows = opportunities.length > 0;

  useEffect(() => {
    document.title = "Opportunities · Guest Experience";
  }, []);

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
              <>
                <OpportunityRows rows={pending} onStatus={setActionStatus} />
                {done.length > 0 ? (
                  <>
                    <tr className="listing-group">
                      <th colSpan={9}>Sold, Signed up, Notified</th>
                    </tr>
                    <OpportunityRows rows={done} settled onStatus={setActionStatus} />
                  </>
                ) : null}
                {rejected.length > 0 ? (
                  <>
                    <tr className="listing-group">
                      <th colSpan={9}>Rejected</th>
                    </tr>
                    <OpportunityRows rows={rejected} settled onStatus={setActionStatus} />
                  </>
                ) : null}
              </>
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
    </div>
  );
}

function OpportunityDrawer({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (opportunity: { guestId: string; category: Exclude<Category, "recovery">; label: string; value?: number }) => void;
}) {
  const [query, setQuery] = useState("");
  const [guestId, setGuestId] = useState("");
  const [category, setCategory] = useState<Exclude<Category, "recovery"> | "">("");
  const [serviceId, setServiceId] = useState("");
  const [experienceId, setExperienceId] = useState("");
  const [housekeepingId, setHousekeepingId] = useState("");

  const guest = guests.find((item) => item.id === guestId);
  const matches = query.trim()
    ? guests
        .filter((item) => item.moment === "check-in" && item.name.toLowerCase().includes(query.trim().toLowerCase()))
        .slice(0, 6)
    : [];

  function pick(id: string, name: string) {
    setGuestId(id);
    setQuery(name);
  }

  function save() {
    if (!guest || !category) return;
    if (category === "upselling") {
      const service = upsellServices.find((item) => item.id === serviceId);
      if (!service) return;
      onAdd({ guestId: guest.id, category, label: service.offer, value: service.value });
    } else if (category === "guest-experience") {
      const experience = experienceTypes.find((item) => item.id === experienceId);
      const housekeeping = housekeepingOptions.find((item) => item.id === housekeepingId);
      if (!experience || !housekeeping) return;
      onAdd({ guestId: guest.id, category, label: `${experience.label}. ${housekeeping.label}` });
    } else {
      onAdd({ guestId: guest.id, category, label: "Invite to the loyalty programme" });
    }
    onClose();
  }

  const ready =
    Boolean(guest) &&
    (category === "loyalty" ||
      (category === "upselling" && serviceId) ||
      (category === "guest-experience" && experienceId && housekeepingId));

  return (
    <div className="drawer-root">
      <button type="button" className="drawer-backdrop" aria-label="Close" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-labelledby="opportunity-title">
        <header className="drawer-head">
          <h2 id="opportunity-title">Add opportunity</h2>
          <button type="button" className="incident-cancel" onClick={onClose}>
            Cancel
          </button>
        </header>
        <label className="drawer-field">
          Guest
          <input
            className="incident-input"
            aria-label="Search guests"
            placeholder="Search by name"
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
                <button type="button" onClick={() => pick(item.id, item.name)}>
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
          Stay
          <input
            className="incident-input"
            readOnly
            value={guest ? stayMomentLabel(guest.moment) : ""}
            placeholder="Check-in, check-out or in-house"
          />
        </label>
        <label className="drawer-field">
          Opportunity type
          <select
            className="status-select"
            aria-label="Opportunity type"
            value={category}
            onChange={(event) => setCategory(event.target.value as Exclude<Category, "recovery"> | "")}
          >
            <option value="">Select</option>
            <option value="upselling">Upselling</option>
            <option value="guest-experience">Guest Experience</option>
            <option value="loyalty">Loyalty</option>
          </select>
        </label>
        {category === "upselling" ? (
          <label className="drawer-field">
            Service
            <select className="status-select" aria-label="Service" value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
              <option value="">Select</option>
              {upsellServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {category === "guest-experience" ? (
          <>
            <label className="drawer-field">
              Type
              <select
                className="status-select"
                aria-label="Guest experience type"
                value={experienceId}
                onChange={(event) => setExperienceId(event.target.value)}
              >
                <option value="">Select</option>
                {experienceTypes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="drawer-field">
              Housekeeping
              <select
                className="status-select"
                aria-label="Housekeeping"
                value={housekeepingId}
                onChange={(event) => setHousekeepingId(event.target.value)}
              >
                <option value="">Select</option>
                {housekeepingOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
        <button type="button" className="add-incident" disabled={!ready} onClick={save}>
          Add opportunity
        </button>
      </aside>
    </div>
  );
}
