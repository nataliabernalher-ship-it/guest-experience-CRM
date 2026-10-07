import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  categoryLabels,
  experienceTypes,
  guests,
  housekeepingOptions,
  stayMomentLabel,
  upsellServices,
  type Category,
  type Guest,
  type GuestStayFilter,
  type PastStay,
  type Severity,
  type ShiftAction,
} from "../data/shift";
import { useShift } from "../state/ShiftState";

function selectedFilter(value: string | null): GuestStayFilter {
  if (value === "arriving" || value === "leaving" || value === "in-house") return value;
  return "all";
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function isOpen(action: ShiftAction): boolean {
  return action.status === "pending" || action.status === "notified" || action.status === "solved";
}

function parseStayDate(label: string): Date | null {
  const parsed = new Date(label);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function stayNights(stay: PastStay): number {
  const from = parseStayDate(stay.from);
  const to = parseStayDate(stay.to);
  if (!from || !to) return 0;
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 86_400_000));
}

function totalStayDays(stays: PastStay[]): number {
  return stays.reduce((sum, stay) => sum + stayNights(stay), 0);
}

export function GuestProfile() {
  const { guestId } = useParams();
  const [params] = useSearchParams();
  const filter = selectedFilter(params.get("stay"));
  const query = params.get("q") ?? "";
  const backQuery = new URLSearchParams();
  if (filter !== "all") backQuery.set("stay", filter);
  if (query) backQuery.set("q", query);
  const backTo = backQuery.size ? `/guests?${backQuery}` : "/guests";
  const { actions, notesByGuest, addGuestNote, addIncident, addOpportunity } = useShift();
  const guest = guests.find((item) => item.id === guestId);

  const [draft, setDraft] = useState("");
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [opportunityOpen, setOpportunityOpen] = useState(false);

  useEffect(() => {
    document.title = guest ? `${guest.name} · Guest Experience` : "Guest · Guest Experience";
    setDraft("");
    setIncidentOpen(false);
    setOpportunityOpen(false);
  }, [guest]);

  if (!guest) {
    return (
      <div className="page guest-file" data-testid="guest-profile">
        <header className="page-header">
          <Link to={backTo} className="listing-back">
            <BackArrow />
            Back to guest profiles
          </Link>
          <h1>Guest not found</h1>
        </header>
      </div>
    );
  }

  const liveIncidents = actions
    .filter((action) => action.guestId === guest.id && action.category === "recovery")
    .map((action) => ({
      id: action.id,
      label: action.label,
      detail: categoryLabels[action.category],
      state: isOpen(action) ? "Open" : "Closed",
      when: "This stay",
    }));
  const pastIncidents = guest.past
    .filter((item) => item.kind === "incident")
    .map((item) => ({
      id: item.id,
      label: item.label,
      detail: "Recovery",
      state: "Closed",
      when: item.when,
    }));
  const incidents = [...liveIncidents, ...pastIncidents];

  const liveOpportunities = actions
    .filter((action) => action.guestId === guest.id && action.category !== "recovery")
    .map((action) => ({
      id: action.id,
      label: action.label,
      detail: categoryLabels[action.category],
      state: isOpen(action) ? "Open" : "Closed",
      when: "This stay",
    }));
  const pastOpportunities = guest.past
    .filter((item) => item.kind === "opportunity")
    .map((item) => ({
      id: item.id,
      label: item.label,
      detail: "Opportunity",
      state: "Closed",
      when: item.when,
    }));
  const opportunities = [...liveOpportunities, ...pastOpportunities];
  const stayDays = totalStayDays(guest.stays);

  return (
    <div className="page guest-file" data-testid="guest-profile">
      <header className="page-header">
        <Link to={backTo} className="listing-back">
          <BackArrow />
          Back to guest profiles
        </Link>
      </header>
      <div className="profile-board">
        <div className="profile-grid">
          <section className="profile-quadrant" aria-label="Personal details">
            <div className="profile-person">
              <span className="avatar profile-avatar" aria-hidden="true">
                {initials(guest.name)}
              </span>
              <h1>{guest.name}</h1>
            </div>
            <dl className="profile-facts-list profile-scroll">
              <div>
                <dt>Origin</dt>
                <dd>{guest.origin}</dd>
              </div>
              <div>
                <dt>Date of birth</dt>
                <dd>{guest.birthDate}</dd>
              </div>
              <div>
                <dt>Profession</dt>
                <dd>{guest.profession}</dd>
              </div>
              <div>
                <dt>Hobbies</dt>
                <dd>{guest.hobbies}</dd>
              </div>
              <div>
                <dt>Companions</dt>
                <dd>
                  {guest.companions.length === 0 ? (
                    "None"
                  ) : (
                    guest.companions.map((companion, index) => (
                      <span key={companion.name}>
                        {index > 0 ? ", " : null}
                        {companion.guestId ? (
                          <Link to={`/guests/${companion.guestId}${backQuery.size ? `?${backQuery}` : ""}`}>
                            {companion.name}
                          </Link>
                        ) : (
                          companion.name
                        )}
                      </span>
                    ))
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="profile-quadrant" aria-label="Stay history">
            <header className="profile-quadrant-head">
              <h2>Stay history</h2>
              <span className="profile-quadrant-meta">
                {stayDays} {stayDays === 1 ? "day" : "days"} total
              </span>
            </header>
            <div className="profile-scroll">
              <ul className="profile-records">
                {guest.stays.map((stay) => (
                  <li key={`${stay.from}-${stay.roomType}`}>
                    <span className="cell-strong">{stay.roomType}</span>
                    <span className="priority-meta">
                      {stay.from} – {stay.to}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="profile-quadrant" aria-label="Incidents">
            <header className="profile-quadrant-head">
              <h2>Incidents</h2>
              <button
                type="button"
                className="profile-add"
                aria-label="Open incident"
                onClick={() => setIncidentOpen(true)}
              >
                <PlusIcon />
              </button>
            </header>
            <div className="profile-scroll">
              {incidents.length === 0 ? (
                <p className="profile-empty">None on file.</p>
              ) : (
                <ul className="profile-records">
                  {incidents.map((record) => (
                    <li key={record.id}>
                      <span className="profile-record-state">{record.state}</span>
                      <span className="cell-strong">{record.label}</span>
                      <span className="priority-meta">
                        {record.detail} · {record.when}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="profile-quadrant" aria-label="Opportunities">
            <header className="profile-quadrant-head">
              <h2>Opportunities</h2>
              <button
                type="button"
                className="profile-add"
                aria-label="Add opportunity"
                onClick={() => setOpportunityOpen(true)}
              >
                <PlusIcon />
              </button>
            </header>
            <div className="profile-scroll">
              {opportunities.length === 0 ? (
                <p className="profile-empty">None on file.</p>
              ) : (
                <ul className="profile-records">
                  {opportunities.map((record) => (
                    <li key={record.id}>
                      <span className="profile-record-state">{record.state}</span>
                      <span className="cell-strong">{record.label}</span>
                      <span className="priority-meta">
                        {record.detail} · {record.when}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="profile-quadrant is-notes" aria-label="Notes">
            <h2>Notes</h2>
            <div className="profile-scroll">
              {[...guest.notes, ...(notesByGuest[guest.id] ?? [])].length === 0 ? (
                <p className="profile-empty">None on file.</p>
              ) : (
                <ul className="profile-records note-list">
                  {[...guest.notes, ...(notesByGuest[guest.id] ?? [])].map((note) => (
                    <li key={`${note.date}-${note.text}`}>
                      <span className="cell-strong">{note.text}</span>
                      <span className="priority-meta">
                        {note.author} · {note.date}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <form
              className="note-form"
              onSubmit={(event) => {
                event.preventDefault();
                addGuestNote(guest.id, draft);
                setDraft("");
              }}
            >
              <textarea
                className="note-input"
                aria-label="Write a note"
                placeholder="Write a note about this guest"
                rows={2}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <button type="submit" className="add-incident" disabled={!draft.trim()}>
                Add note
              </button>
            </form>
          </section>
        </div>
      </div>
      {incidentOpen ? (
        <ProfileIncidentDrawer
          guest={guest}
          onClose={() => setIncidentOpen(false)}
          onAdd={addIncident}
        />
      ) : null}
      {opportunityOpen ? (
        <ProfileOpportunityDrawer
          guest={guest}
          onClose={() => setOpportunityOpen(false)}
          onAdd={addOpportunity}
        />
      ) : null}
    </div>
  );
}

function ProfileIncidentDrawer({
  guest,
  onClose,
  onAdd,
}: {
  guest: Guest;
  onClose: () => void;
  onAdd: (incident: { guestId: string; label: string; description: string; severity: Severity }) => void;
}) {
  const [labelText, setLabelText] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("normal");

  function save() {
    if (!labelText.trim()) return;
    onAdd({ guestId: guest.id, label: labelText, description, severity });
    onClose();
  }

  return (
    <div className="drawer-root">
      <button type="button" className="drawer-backdrop" aria-label="Close" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-labelledby="profile-incident-title">
        <header className="drawer-head">
          <h2 id="profile-incident-title">Open incident</h2>
          <button type="button" className="incident-cancel" onClick={onClose}>
            Cancel
          </button>
        </header>
        <label className="drawer-field">
          Guest
          <input className="incident-input" readOnly value={guest.name} />
        </label>
        <label className="drawer-field">
          Room
          <input className="incident-input" readOnly value={guest.room} />
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
        <button type="button" className="add-incident" disabled={!labelText.trim()} onClick={save}>
          Open incident
        </button>
      </aside>
    </div>
  );
}

function ProfileOpportunityDrawer({
  guest,
  onClose,
  onAdd,
}: {
  guest: Guest;
  onClose: () => void;
  onAdd: (opportunity: {
    guestId: string;
    category: Exclude<Category, "recovery">;
    label: string;
    value?: number;
  }) => void;
}) {
  const [category, setCategory] = useState<Exclude<Category, "recovery"> | "">("");
  const [serviceId, setServiceId] = useState("");
  const [experienceId, setExperienceId] = useState("");
  const [housekeepingId, setHousekeepingId] = useState("");

  function save() {
    if (!category) return;
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
    category === "loyalty" ||
    (category === "upselling" && Boolean(serviceId)) ||
    (category === "guest-experience" && Boolean(experienceId) && Boolean(housekeepingId));

  return (
    <div className="drawer-root">
      <button type="button" className="drawer-backdrop" aria-label="Close" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-labelledby="profile-opportunity-title">
        <header className="drawer-head">
          <h2 id="profile-opportunity-title">Add opportunity</h2>
          <button type="button" className="incident-cancel" onClick={onClose}>
            Cancel
          </button>
        </header>
        <label className="drawer-field">
          Guest
          <input className="incident-input" readOnly value={guest.name} />
        </label>
        <label className="drawer-field">
          Room
          <input className="incident-input" readOnly value={guest.room} />
        </label>
        <label className="drawer-field">
          Stay
          <input className="incident-input" readOnly value={stayMomentLabel(guest.moment)} />
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
            <option value="guest-experience">Special amenities</option>
            <option value="loyalty">Loyalty</option>
          </select>
        </label>
        {category === "upselling" ? (
          <label className="drawer-field">
            Service
            <select
              className="status-select"
              aria-label="Service"
              value={serviceId}
              onChange={(event) => setServiceId(event.target.value)}
            >
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
                aria-label="Special amenities type"
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

function BackArrow() {
  return (
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
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M7 2.5v9M2.5 7h9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
