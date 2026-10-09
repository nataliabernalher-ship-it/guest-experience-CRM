import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { GuestIncidentDrawer } from "../components/GuestIncidentDrawer";
import { GuestOpportunityDrawer } from "../components/GuestOpportunityDrawer";
import { EmptyState, ErrorState, LoadingState } from "../components/ViewState";
import { formatGuestRegion } from "../data/regions";
import {
  boardTypeLabels,
  bookingSourceLabels,
  categoryLabels,
  formatSpend,
  guests,
  spendCategoryLabels,
  travelCompanionshipLabels,
  type GuestSpend,
  type GuestStayFilter,
  type PastStay,
  type ShiftAction,
} from "../data/shift";
import { useViewLoad } from "../hooks/useViewLoad";
import { useShift } from "../state/ShiftState";

const spendColors: Record<keyof GuestSpend, string> = {
  stay: "#F47920",
  extras: "#3D6B5A",
};

const spendOrder: Array<keyof GuestSpend> = ["stay", "extras"];

function SpendDonut({ spend }: { spend: GuestSpend }) {
  const total = spend.stay + spend.extras;
  const size = 112;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="spend-chart">
      <div className="spend-donut" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(21, 21, 21, 0.06)"
            strokeWidth={stroke}
          />
          {spendOrder.map((key) => {
            const value = spend[key];
            const length = total > 0 ? (value / total) * circumference : 0;
            const segment = (
              <circle
                key={key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={spendColors[key]}
                strokeWidth={stroke}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
            offset += length;
            return segment;
          })}
        </svg>
        <div className="spend-donut-center">
          <strong>{formatSpend(total)}</strong>
          <span>Total</span>
        </div>
      </div>
      <ul className="spend-legend">
        {spendOrder.map((key) => (
          <li key={key}>
            <span className="spend-swatch" style={{ background: spendColors[key] }} />
            <span className="spend-legend-label">{spendCategoryLabels[key]}</span>
            <span className="spend-legend-value">{formatSpend(spend[key])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
  const { status, retry } = useViewLoad(`guest-${guestId ?? "missing"}`);

  const [draft, setDraft] = useState("");
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [opportunityOpen, setOpportunityOpen] = useState(false);

  useEffect(() => {
    document.title = guest ? `${guest.name} · Guest Experience` : "Guest · Guest Experience";
    setDraft("");
    setIncidentOpen(false);
    setOpportunityOpen(false);
  }, [guest]);

  if (status === "loading") {
    return (
      <div className="page guest-file" data-testid="guest-profile">
        <header className="page-header">
          <Link to={backTo} className="listing-back">
            <BackArrow />
            Back to guest profiles
          </Link>
        </header>
        <div className="page-view-state">
          <LoadingState
            title="Loading guest profile"
            description="We’re opening this guest’s details, stay history, and open actions."
          />
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="page guest-file" data-testid="guest-profile">
        <header className="page-header">
          <Link to={backTo} className="listing-back">
            <BackArrow />
            Back to guest profiles
          </Link>
        </header>
        <div className="page-view-state">
          <ErrorState
            title="Couldn’t open this guest"
            description="The profile didn’t load. Try again, or go back to the guest list."
            action={
              <>
                <button type="button" className="add-incident" onClick={retry}>
                  Try again
                </button>
                <Link to={backTo} className="view-all">
                  Back to guest profiles
                </Link>
              </>
            }
          />
        </div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="page guest-file" data-testid="guest-profile">
        <header className="page-header">
          <Link to={backTo} className="listing-back">
            <BackArrow />
            Back to guest profiles
          </Link>
        </header>
        <div className="page-view-state">
          <ErrorState
            title="Guest not found"
            description="This guest id isn’t in the current list. Go back and choose another profile, or check the link."
            action={
              <Link to={backTo} className="view-all">
                Back to guest profiles
              </Link>
            }
          />
        </div>
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
      state:
        action.status === "rejected"
          ? "Rejected"
          : action.status === "done" || action.status === "confirmed"
            ? "Done"
            : isOpen(action)
              ? "Open"
              : "Done",
      when: "This stay",
    }));
  const pastOpportunities = guest.past
    .filter((item) => item.kind === "opportunity")
    .map((item) => ({
      id: item.id,
      label: item.label,
      detail: categoryLabels[item.category ?? "guest-experience"],
      state: item.outcome === "rejected" ? "Rejected" : "Done",
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
          <section className="profile-quadrant is-demographics" aria-label="Personal details">
            <div className="profile-person">
              <span className="avatar profile-avatar" aria-hidden="true">
                {initials(guest.name)}
              </span>
              <h1>{guest.name}</h1>
            </div>
            <dl className="profile-facts-list">
              <div>
                <dt>Origin</dt>
                <dd>{guest.origin}</dd>
              </div>
              <div>
                <dt>Country</dt>
                <dd>{guest.country}</dd>
              </div>
              <div>
                <dt>Region</dt>
                <dd>{formatGuestRegion(guest.region)}</dd>
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
              <div className="is-wide">
                <dt>Companions</dt>
                <dd>{travelCompanionshipLabels[guest.companionship]}</dd>
              </div>
            </dl>
          </section>

          <section className="profile-quadrant is-stay" aria-label="Stay history">
            <header className="profile-quadrant-head">
              <h2>Stay history</h2>
              <span className="profile-quadrant-meta">
                {stayDays} {stayDays === 1 ? "day" : "days"} total
              </span>
            </header>
            <div className="profile-scroll">
              <ul className="profile-records">
                {guest.stays.map((stay) => (
                  <li key={`${stay.from}-${stay.roomType}`} className="profile-stay-row">
                    <div className="profile-stay-main">
                      <span className="cell-strong">{stay.roomType}</span>
                      <span className="cell-strong profile-stay-board">
                        {boardTypeLabels[stay.boardType]}
                      </span>
                    </div>
                    <span className="priority-meta">
                      {stay.from} – {stay.to} · {bookingSourceLabels[stay.bookingSource]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="profile-quadrant is-preferences" aria-label="Preferences">
            <header className="profile-quadrant-head">
              <h2>Preferences</h2>
            </header>
            <dl className="profile-facts-list is-stacked">
              <div>
                <dt>Room type</dt>
                <dd>{guest.preferences.roomType}</dd>
              </div>
              <div>
                <dt>Bed type</dt>
                <dd>{guest.preferences.bedType}</dd>
              </div>
              <div>
                <dt>Pillow type</dt>
                <dd>{guest.preferences.pillowType}</dd>
              </div>
              <div>
                <dt>Dining</dt>
                <dd>{guest.preferences.dining}</dd>
              </div>
            </dl>
          </section>

          <section className="profile-quadrant is-incidents" aria-label="Incidents">
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
                <EmptyState
                  title="No incidents on file"
                  description="Nothing recorded for this guest yet. Use + to open a new incident."
                />
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

          <section className="profile-quadrant is-opportunities" aria-label="Opportunities">
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
                <EmptyState
                  title="No opportunities on file"
                  description="No upselling, amenity or loyalty actions yet. Use + to add one."
                />
              ) : (
                <ul className="profile-records is-opp-list">
                  {opportunities.map((record) => (
                    <li key={record.id} className="profile-opp-item">
                      <div className="profile-opp-main">
                        <span className="cell-strong">{record.detail}</span>
                        <span className="priority-meta">
                          {record.label} · {record.when}
                        </span>
                      </div>
                      <span className="profile-record-state">{record.state}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="profile-quadrant is-spend" aria-label="Spend">
            <header className="profile-quadrant-head">
              <h2>Spend</h2>
            </header>
            <SpendDonut spend={guest.spend} />
          </section>

          <section className="profile-quadrant is-notes" aria-label="Notes">
            <h2>Notes</h2>
            <div className="notes-body">
              <div className="profile-scroll notes-list-pane">
                {[...guest.notes, ...(notesByGuest[guest.id] ?? [])].length === 0 ? (
                  <EmptyState
                    title="No notes yet"
                    description="Add a note below so the next shift knows what matters for this guest."
                  />
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
                  rows={4}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button type="submit" className="add-incident" disabled={!draft.trim()}>
                  Add note
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
      {incidentOpen ? (
        <GuestIncidentDrawer guest={guest} onClose={() => setIncidentOpen(false)} onAdd={addIncident} />
      ) : null}
      {opportunityOpen ? (
        <GuestOpportunityDrawer guest={guest} onClose={() => setOpportunityOpen(false)} onAdd={addOpportunity} />
      ) : null}
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
