import { useState } from "react";
import { type Guest } from "../data/shift";

export function GuestPreferenceDrawer({
  guest,
  onClose,
  onAdd,
}: {
  guest: Guest;
  onClose: () => void;
  onAdd: (preference: { guestId: string; type: string; description: string }) => void;
}) {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");

  function save() {
    const preferenceType = type.trim();
    const preferenceDescription = description.trim();
    if (!preferenceType || !preferenceDescription) return;
    onAdd({ guestId: guest.id, type: preferenceType, description: preferenceDescription });
    onClose();
  }

  const ready = Boolean(type.trim() && description.trim());

  return (
    <div className="drawer-root">
      <button type="button" className="drawer-backdrop" aria-label="Close" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-labelledby="guest-preference-title">
        <header className="drawer-head">
          <h2 id="guest-preference-title">Add preference</h2>
          <button type="button" className="incident-cancel" onClick={onClose}>
            Cancel
          </button>
        </header>
        <label className="drawer-field">
          Guest
          <input className="incident-input" readOnly value={guest.name} />
        </label>
        <label className="drawer-field">
          Type
          <input
            className="incident-input"
            aria-label="Preference type"
            placeholder="e.g. Pillow, Wake-up call"
            value={type}
            onChange={(event) => setType(event.target.value)}
          />
        </label>
        <label className="drawer-field">
          Description
          <textarea
            className="incident-input is-area"
            aria-label="Preference description"
            placeholder="Describe the preference"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <button type="button" className="add-incident" disabled={!ready} onClick={save}>
          Add preference
        </button>
      </aside>
    </div>
  );
}
