import { useState } from "react";
import {
  experienceTypes,
  guests,
  housekeepingOptions,
  roommatesForGuest,
  upsellServices,
  type Category,
} from "../data/shift";
import { AutomationPreview } from "./GuestOpportunityDrawer";
import { useAutomations } from "../state/AutomationsState";

type OpportunityPayload = {
  guestId: string;
  category: Exclude<Category, "recovery">;
  label: string;
  value?: number;
  description?: string;
};

export function OpportunityDrawer({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (opportunity: OpportunityPayload) => void;
}) {
  const { activeAutomations } = useAutomations();
  const [query, setQuery] = useState("");
  const [guestId, setGuestId] = useState("");
  const [applyToRoom, setApplyToRoom] = useState(false);
  const [automationId, setAutomationId] = useState("");
  const [category, setCategory] = useState<Exclude<Category, "recovery"> | "">("");
  const [serviceId, setServiceId] = useState("");
  const [experienceId, setExperienceId] = useState("");
  const [housekeepingId, setHousekeepingId] = useState("");

  const guest = guests.find((item) => item.id === guestId);
  const selectedAutomation = activeAutomations.find((item) => item.id === automationId) ?? null;
  const fromAutomation = Boolean(selectedAutomation);
  const matches = query.trim()
    ? guests
        .filter(
          (item) =>
            (item.moment === "check-in" || item.moment === "check-out" || item.moment === "in-house") &&
            item.name.toLowerCase().includes(query.trim().toLowerCase()),
        )
        .slice(0, 6)
    : [];

  function pick(id: string, name: string) {
    setGuestId(id);
    setQuery(name);
    setApplyToRoom(false);
  }

  function applyAutomation(id: string) {
    setAutomationId(id);
    const automation = activeAutomations.find((item) => item.id === id);
    if (!automation) {
      setCategory("");
      return;
    }
    setCategory(automation.category);
    setServiceId("");
    setExperienceId("");
    setHousekeepingId("");
  }

  function targetGuestIds(): string[] {
    if (!guest) return [];
    if (!applyToRoom) return [guest.id];
    return roommatesForGuest(guest).map((item) => item.id);
  }

  function save() {
    if (!guest) return;
    const guestIds = targetGuestIds();
    if (selectedAutomation) {
      for (const id of guestIds) {
        onAdd({
          guestId: id,
          category: selectedAutomation.category,
          label: selectedAutomation.actionLabel,
          value:
            selectedAutomation.category === "upselling"
              ? selectedAutomation.valuePerPerson
              : undefined,
          description: selectedAutomation.description,
        });
      }
      onClose();
      return;
    }
    if (!category) return;
    let base: Omit<OpportunityPayload, "guestId"> | null = null;
    if (category === "upselling") {
      const service = upsellServices.find((item) => item.id === serviceId);
      if (!service) return;
      base = { category, label: service.offer, value: service.value };
    } else if (category === "guest-experience") {
      const experience = experienceTypes.find((item) => item.id === experienceId);
      const housekeeping = housekeepingOptions.find((item) => item.id === housekeepingId);
      if (!experience || !housekeeping) return;
      base = { category, label: `${experience.label}. ${housekeeping.label}` };
    } else {
      base = { category, label: "Invite to the loyalty programme" };
    }
    for (const id of guestIds) onAdd({ guestId: id, ...base });
    onClose();
  }

  const ready =
    Boolean(guest) &&
    (fromAutomation ||
      category === "loyalty" ||
      (category === "upselling" && Boolean(serviceId)) ||
      (category === "guest-experience" && Boolean(experienceId) && Boolean(housekeepingId)));

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
        <label className="drawer-check">
          <input
            type="checkbox"
            checked={applyToRoom}
            disabled={!guest}
            onChange={(event) => setApplyToRoom(event.target.checked)}
          />
          <span>Add to all people in the room</span>
        </label>
        {activeAutomations.length > 0 ? (
          <label className="drawer-field">
            From automation
            <select
              className="status-select"
              aria-label="From automation"
              value={automationId}
              onChange={(event) => {
                if (event.target.value) applyAutomation(event.target.value);
                else {
                  setAutomationId("");
                  setCategory("");
                }
              }}
            >
              <option value="">Select manually</option>
              {activeAutomations.map((automation) => (
                <option key={automation.id} value={automation.id}>
                  {automation.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {selectedAutomation ? (
          <AutomationPreview automation={selectedAutomation} />
        ) : (
          <>
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
          </>
        )}
        <button type="button" className="add-incident" disabled={!ready} onClick={save}>
          Add opportunity
        </button>
      </aside>
    </div>
  );
}
