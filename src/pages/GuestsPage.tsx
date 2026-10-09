import { useEffect } from "react";
import { Link, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/ViewState";
import {
  guestsForFilter,
  isLoyaltyMember,
  peopleCount,
  shiftDay,
  type Guest,
  type GuestStayFilter,
} from "../data/shift";
import { useViewLoad } from "../hooks/useViewLoad";
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

function VipStar() {
  return (
    <svg className="guest-vip-star" width="18" height="18" viewBox="0 0 18 18" aria-label="VIP" role="img">
      <path
        d="M9 1.6 11.1 6.2l5 .4-3.8 3.2 1.2 4.8L9 12.2l-4.5 2.4 1.2-4.8L1.9 6.6l5-.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function GuestMarks({ guest }: { guest: Guest }) {
  if (guest.vip) return <VipStar />;
  if (guest.previousStays >= 1) return <span className="guest-badge is-returning">Returning</span>;
  return null;
}

function LoyaltyMark() {
  return (
    <svg className="guest-loyalty-mark" width="18" height="18" viewBox="0 0 20 20" aria-label="Loyalty member" role="img">
      <path d="M10 2.6 15.8 9.5 10 16.4 4.2 9.5Z" fill="currentColor" />
    </svg>
  );
}

export function GuestsPage() {
  const navigate = useNavigate();
  const { actions } = useShift();
  const [params, setParams] = useSearchParams();
  const filter = selectedFilter(params.get("stay"));
  const query = params.get("q") ?? "";
  const needle = query.trim().toLowerCase();
  const { status, retry } = useViewLoad(`guests-${filter}-${needle}`);
  const rows = guestsForFilter(filter).filter((guest) => {
    if (!needle) return true;
    return guest.name.toLowerCase().includes(needle) || guest.room.includes(needle);
  });
  const profileQuery = new URLSearchParams();
  if (filter !== "all") profileQuery.set("stay", filter);
  if (query) profileQuery.set("q", query);
  const profileSuffix = profileQuery.size ? `?${profileQuery}` : "";
  const hasActiveFilters = filter !== "all" || needle.length > 0;

  useEffect(() => {
    document.title = "Guest Profiles · Guest Experience";
  }, []);

  function clearFilters() {
    setParams({}, { replace: true });
  }

  return (
    <>
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
        {status === "loading" ? (
          <LoadingState
            title="Loading guest profiles"
            description="We’re loading the guest list for the selected stay filter."
          />
        ) : status === "error" ? (
          <ErrorState
            title="Couldn’t load guests"
            description="The guest list didn’t load. Try again, or clear filters and reload."
            action={
              <>
                <button type="button" className="add-incident" onClick={retry}>
                  Try again
                </button>
                {hasActiveFilters ? (
                  <button type="button" className="guest-tag" onClick={clearFilters}>
                    Clear filters
                  </button>
                ) : null}
              </>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title={hasActiveFilters ? "No guests match these filters" : "No guests yet"}
            description={
              hasActiveFilters
                ? "Try another stay filter or clear the search to see more profiles."
                : "When guests are in house, they will appear here so you can open their profile or add actions."
            }
            action={
              hasActiveFilters ? (
                <button type="button" className="add-incident" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
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
                    {member ? <LoyaltyMark /> : null}
                  </td>
                  <td className="cell-view">
                    <Link
                      to={href}
                      className="guest-view-link"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </section>
    </div>
    <Outlet />
    </>
  );
}
