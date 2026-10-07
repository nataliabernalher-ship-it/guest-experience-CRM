import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { GuestIncidentDrawer } from "../components/GuestIncidentDrawer";
import { GuestOpportunityDrawer } from "../components/GuestOpportunityDrawer";
import {
  guestById,
  guestsForFilter,
  isLoyaltyMember,
  peopleCount,
  shiftDay,
  type Guest,
  type GuestStayFilter,
} from "../data/shift";
import { useShift } from "../state/ShiftState";

const filters: { id: GuestStayFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "arriving", label: "Arriving today" },
  { id: "leaving", label: "Leaving today" },
  { id: "in-house", label: "In house" },
];

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

const months: Record<string, number> = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};

function age(birthDate: string): number {
  const [dayText, monthText, yearText] = birthDate.split(" ");
  const birth = new Date(Number(yearText), months[monthText] ?? 0, Number(dayText));
  let years = shiftDay.getFullYear() - birth.getFullYear();
  const monthDelta = shiftDay.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && shiftDay.getDate() < birth.getDate())) years -= 1;
  return years;
}

function shortStayDate(value: string): string {
  return value.replace(/\b(\d{2})(\d{2})\b/, "$2");
}

function stayRange(arrival: string, departure: string): string {
  return `${shortStayDate(arrival)} – ${shortStayDate(departure)}`;
}

function LightbulbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 1.75a3.6 3.6 0 0 0-2.2 6.45c.3.24.45.5.5.85v.7h3.4v-.7c.05-.35.2-.61.5-.85A3.6 3.6 0 0 0 8 1.75Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M6.6 12.35h2.8M7 13.6h2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function BandageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect
        x="2.4"
        y="5.6"
        width="11.2"
        height="4.8"
        rx="2.2"
        transform="rotate(-35 8 8)"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="8" cy="8" r="0.85" fill="currentColor" />
      <circle cx="6.55" cy="9.1" r="0.55" fill="currentColor" />
      <circle cx="9.45" cy="6.9" r="0.55" fill="currentColor" />
    </svg>
  );
}

function GuestMarks({ guest }: { guest: Guest }) {
  if (guest.vip) return <span className="guest-badge is-vip">VIP</span>;
  if (guest.previousStays >= 1) return <span className="guest-badge is-returning">Returning</span>;
  return <span className="guest-none">–</span>;
}

export function GuestsPage() {
  const navigate = useNavigate();
  const { actions, addIncident, addOpportunity } = useShift();
  const [params, setParams] = useSearchParams();
  const [opportunityGuestId, setOpportunityGuestId] = useState<string | null>(null);
  const [incidentGuestId, setIncidentGuestId] = useState<string | null>(null);
  const filter = selectedFilter(params.get("stay"));
  const query = params.get("q") ?? "";
  const needle = query.trim().toLowerCase();
  const rows = guestsForFilter(filter).filter((guest) => {
    if (!needle) return true;
    return guest.name.toLowerCase().includes(needle) || guest.room.includes(needle);
  });
  const profileQuery = new URLSearchParams();
  if (filter !== "all") profileQuery.set("stay", filter);
  if (query) profileQuery.set("q", query);
  const profileSuffix = profileQuery.size ? `?${profileQuery}` : "";
  const opportunityGuest = opportunityGuestId ? guestById(opportunityGuestId) : null;
  const incidentGuest = incidentGuestId ? guestById(incidentGuestId) : null;

  useEffect(() => {
    document.title = "Guest Profiles · Guest Experience";
  }, []);

  return (
    <div className="page" data-testid="guests-list">
      <header className="page-header">
        <h1>Guest Profiles</h1>
        <p className="people-total">{peopleCount()} guests</p>
      </header>
      <section className="table-card">
        <div className="guest-toolbar">
          <div className="guest-tags" role="tablist" aria-label="Stay">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                className={filter === item.id ? "guest-tag is-active" : "guest-tag"}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  if (item.id === "all") next.delete("stay");
                  else next.set("stay", item.id);
                  setParams(next);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="guest-search">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <circle cx="6" cy="6" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="M9.2 9.2 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              aria-label="Search guests"
              placeholder="Search guests"
              value={query}
              onChange={(event) => {
                const next = new URLSearchParams(params);
                if (event.target.value) next.set("q", event.target.value);
                else next.delete("q");
                setParams(next, { replace: true });
              }}
            />
          </label>
        </div>
        <table className="listing-table is-guests">
          <colgroup>
            <col className="col-guest" />
            <col className="col-stay" />
            <col className="col-room" />
            <col className="col-people" />
            <col className="col-origin" />
            <col className="col-age" />
            <col className="col-vip" />
            <col className="col-loyalty" />
            <col className="col-actions" />
          </colgroup>
          <thead>
            <tr>
              <th>Guest</th>
              <th>Stay</th>
              <th>Room</th>
              <th>People</th>
              <th>Origin</th>
              <th>Age</th>
              <th>VIP and returning</th>
              <th>Loyalty</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="guest-empty" colSpan={9}>
                  No guests.
                </td>
              </tr>
            ) : null}
            {rows.map((guest) => {
              const href = `/guests/${guest.id}${profileSuffix}`;
              const member = isLoyaltyMember(guest, actions);
              return (
                <tr
                  key={guest.id}
                  className="guest-row"
                  tabIndex={0}
                  aria-label={guest.name}
                  onClick={() => navigate(href)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(href);
                    }
                  }}
                >
                  <td>
                    <Link to={href} className="guest-cell guest-link" onClick={(event) => event.stopPropagation()}>
                      <span className="avatar" aria-hidden="true">
                        {initials(guest.name)}
                      </span>
                      <span className="cell-strong">{guest.name}</span>
                    </Link>
                  </td>
                  <td className="guest-dates">{stayRange(guest.arrival, guest.departure)}</td>
                  <td>{guest.room}</td>
                  <td>{guest.partySize}</td>
                  <td>{guest.origin}</td>
                  <td>{age(guest.birthDate)}</td>
                  <td>
                    <GuestMarks guest={guest} />
                  </td>
                  <td className={member ? "loyalty-member" : "loyalty-out"}>
                    {member ? "Member" : "Not enrolled"}
                  </td>
                  <td className="cell-view">
                    <div className="guest-row-actions">
                      <button
                        type="button"
                        className="guest-quick-add"
                        aria-label={`Add opportunity for ${guest.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpportunityGuestId(guest.id);
                        }}
                      >
                        <LightbulbIcon />
                        <span aria-hidden="true">+</span>
                      </button>
                      <button
                        type="button"
                        className="guest-quick-add"
                        aria-label={`Open incident for ${guest.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setIncidentGuestId(guest.id);
                        }}
                      >
                        <BandageIcon />
                        <span aria-hidden="true">+</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      {opportunityGuest ? (
        <GuestOpportunityDrawer
          guest={opportunityGuest}
          onClose={() => setOpportunityGuestId(null)}
          onAdd={addOpportunity}
        />
      ) : null}
      {incidentGuest ? (
        <GuestIncidentDrawer guest={incidentGuest} onClose={() => setIncidentGuestId(null)} onAdd={addIncident} />
      ) : null}
    </div>
  );
}
