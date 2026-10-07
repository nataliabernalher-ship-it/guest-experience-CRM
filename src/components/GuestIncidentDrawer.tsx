import { useState } from "react";
import { type Guest, type Severity } from "../data/shift";

export function GuestIncidentDrawer({
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
      <aside className="drawer" role="dialog" aria-labelledby="guest-incident-title">
        <header className="drawer-head">
          <h2 id="guest-incident-title">Open incident</h2>
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
