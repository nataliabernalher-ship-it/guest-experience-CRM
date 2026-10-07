import { useState } from "react";
import { automationCategoryLabel, type Automation } from "../data/automations";
import {
  experienceTypes,
  housekeepingOptions,
  stayMomentLabel,
  upsellServices,
  type Category,
  type Guest,
} from "../data/shift";
import { useAutomations } from "../state/AutomationsState";

export function GuestOpportunityDrawer({
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
    description?: string;
  }) => void;
}) {
  const { activeAutomations } = useAutomations();
  const [automationId, setAutomationId] = useState("");
  const [category, setCategory] = useState<Exclude<Category, "recovery"> | "">("");
  const [serviceId, setServiceId] = useState("");
  const [experienceId, setExperienceId] = useState("");
  const [housekeepingId, setHousekeepingId] = useState("");

  const selectedAutomation = activeAutomations.find((item) => item.id === automationId) ?? null;
  const fromAutomation = Boolean(selectedAutomation);

  function applyAutomation(id: string) {
    setAutomationId(id);
    const automation = activeAutomations.find((item) => item.id === id);
    if (!automation) {
      setCategory("");
      setServiceId("");
      setExperienceId("");
      setHousekeepingId("");
      return;
    }
    setCategory(automation.category);
    setServiceId("");
    setExperienceId("");
    setHousekeepingId("");
  }

  function clearAutomation() {
    setAutomationId("");
  }

  function save() {
    if (selectedAutomation) {
      onAdd({
        guestId: guest.id,
        category: selectedAutomation.category,
        label: selectedAutomation.actionLabel,
        value:
          selectedAutomation.category === "upselling" ? selectedAutomation.valuePerPerson : undefined,
        description: selectedAutomation.description,
      });
      onClose();
      return;
    }

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

  const ready = fromAutomation
    ? true
    : category === "loyalty" ||
      (category === "upselling" && Boolean(serviceId)) ||
      (category === "guest-experience" && Boolean(experienceId) && Boolean(housekeepingId));

  return (
    <div className="drawer-root">
      <button type="button" className="drawer-backdrop" aria-label="Close" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-labelledby="guest-opportunity-title">
        <header className="drawer-head">
          <h2 id="guest-opportunity-title">Add opportunity</h2>
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

        {activeAutomations.length > 0 ? (
          <label className="drawer-field">
            From automation
            <select
              className="status-select"
              aria-label="From automation"
              value={automationId}
              onChange={(event) => {
                if (event.target.value) applyAutomation(event.target.value);
                else clearAutomation();
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

export function AutomationPreview({ automation }: { automation: Automation }) {
  return (
    <div className="automation-pick-preview">
      <p className="automation-pick-title">{automation.name}</p>
      <dl className="automation-pick-facts">
        <div>
          <dt>Category</dt>
          <dd>{automationCategoryLabel(automation.category)}</dd>
        </div>
        <div>
          <dt>Action</dt>
          <dd>{automation.actionLabel}</dd>
        </div>
        {automation.category === "upselling" && automation.valuePerPerson != null ? (
          <div>
            <dt>Value per person</dt>
            <dd>{automation.valuePerPerson}€</dd>
          </div>
        ) : null}
        {automation.description?.trim() ? (
          <div>
            <dt>Details</dt>
            <dd>{automation.description.trim()}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
