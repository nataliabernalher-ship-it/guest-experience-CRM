import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { categoryLabels, guests, type GuestStayFilter, type ShiftAction } from "../data/shift";
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

export function GuestProfile() {
  const { guestId } = useParams();
  const [params] = useSearchParams();
  const filter = selectedFilter(params.get("stay"));
  const query = params.get("q") ?? "";
  const backQuery = new URLSearchParams();
  if (filter !== "all") backQuery.set("stay", filter);
  if (query) backQuery.set("q", query);
  const backTo = backQuery.size ? `/guests?${backQuery}` : "/guests";
  const { actions, notesByGuest, addGuestNote } = useShift();
  const guest = guests.find((item) => item.id === guestId);

  const [draft, setDraft] = useState("");

  useEffect(() => {
    document.title = guest ? `${guest.name} · Guest Experience` : "Guest · Guest Experience";
    setDraft("");
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

  const live = actions
    .filter((action) => action.guestId === guest.id)
    .map((action) => ({
      id: action.id,
      kind: action.category === "recovery" ? "Incident" : "Opportunity",
      label: action.label,
      detail: categoryLabels[action.category],
      state: isOpen(action) ? "Open" : "Closed",
      when: "This stay",
    }));
  const past = guest.past.map((item) => ({
    id: item.id,
    kind: item.kind === "incident" ? "Incident" : "Opportunity",
    label: item.label,
    detail: item.kind === "incident" ? "Recovery" : "Opportunity",
    state: "Closed",
    when: item.when,
  }));
  const records = [...live, ...past];

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
          <h2>Stay history</h2>
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

        <section className="profile-quadrant" aria-label="Incidents and opportunities">
          <h2>Incidents and opportunities</h2>
          <div className="profile-scroll">
            {records.length === 0 ? (
              <p className="profile-empty">None on file.</p>
            ) : (
              <ul className="profile-records">
                {records.map((record) => (
                  <li key={record.id}>
                    <span className="profile-record-state">
                      {record.state} · {record.kind}
                    </span>
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

        <section className="profile-quadrant" aria-label="Notes">
          <h2>Notes</h2>
          {[...guest.notes, ...(notesByGuest[guest.id] ?? [])].length > 0 ? (
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
          ) : null}
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
