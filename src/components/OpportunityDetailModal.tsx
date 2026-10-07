import { Link } from "react-router-dom";
import {
  experienceTypes,
  guestById,
  housekeepingOptions,
  money,
  stayMomentLabel,
  upsellServices,
  type ActionStatus,
  type Category,
  type ShiftAction,
} from "../data/shift";
import { CategoryPill } from "./CategoryPill";
import { useShift } from "../state/ShiftState";

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M3 3l8 8M11 3 3 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function positiveLabel(category: Category): string {
  if (category === "upselling") return "Sold";
  if (category === "loyalty") return "Signed up";
  if (category === "guest-experience") return "Notified";
  return "Done";
}

function outcomeLabel(action: ShiftAction): string {
  if (action.status === "rejected") return "Rejected";
  if (action.status === "done") return positiveLabel(action.category);
  return "Pending";
}

function upsellServiceFor(action: ShiftAction) {
  return upsellServices.find((service) => service.offer === action.label || service.value === action.value);
}

function experienceParts(label: string): { type: string; housekeeping: string | null } {
  const match = housekeepingOptions.find((option) => label.endsWith(`. ${option.label}`));
  if (match) {
    return {
      type: label.slice(0, -(match.label.length + 2)).trim() || label,
      housekeeping: match.label,
    };
  }
  const known = experienceTypes.find((item) => item.label === label);
  return { type: known?.label ?? label, housekeeping: null };
}

export function OpportunityDetailModal({
  action,
  onClose,
}: {
  action: ShiftAction;
  onClose: () => void;
}) {
  const { setActionStatus } = useShift();
  const guest = guestById(action.guestId);
  const pending = action.status === "pending";
  const service = action.category === "upselling" ? upsellServiceFor(action) : undefined;
  const experience = action.category === "guest-experience" ? experienceParts(action.label) : null;

  function respond(status: Extract<ActionStatus, "done" | "rejected">) {
    if (action.status === status) return;
    setActionStatus(action.id, status);
    onClose();
  }

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Close" onClick={onClose} />
      <aside className="incident-modal opportunity-modal" role="dialog" aria-labelledby="opportunity-detail-title">
        <header className="incident-modal-head">
          <div>
            <p className="eyebrow">Opportunity</p>
            <h2 id="opportunity-detail-title">{action.label}</h2>
          </div>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>

        <dl className="incident-facts">
          <div>
            <dt>Guest</dt>
            <dd>
              <Link to={`/guests/${guest.id}`} className="guest-link is-underlined" onClick={onClose}>
                {guest.name}
              </Link>
            </dd>
          </div>
          <div>
            <dt>Room</dt>
            <dd>{guest.room}</dd>
          </div>
          <div>
            <dt>Stay</dt>
            <dd>{stayMomentLabel(guest.moment)}</dd>
          </div>
          <div>
            <dt>Opportunity type</dt>
            <dd>
              <CategoryPill category={action.category} />
            </dd>
          </div>
          {action.category === "upselling" ? (
            <>
              <div>
                <dt>Service</dt>
                <dd>{service?.label ?? action.label}</dd>
              </div>
              <div>
                <dt>Value</dt>
                <dd>{action.value != null ? money.format(action.value) : "—"}</dd>
              </div>
            </>
          ) : null}
          {action.category === "guest-experience" && experience ? (
            <>
              <div>
                <dt>Type</dt>
                <dd>{experience.type}</dd>
              </div>
              <div>
                <dt>Housekeeping</dt>
                <dd>{experience.housekeeping ?? "—"}</dd>
              </div>
            </>
          ) : null}
          {action.category === "loyalty" ? (
            <div className="is-wide">
              <dt>Opportunity</dt>
              <dd>{action.label}</dd>
            </div>
          ) : null}
          <div className="is-wide">
            <dt>Guest response</dt>
            <dd>{outcomeLabel(action)}</dd>
          </div>
        </dl>

        {pending ? (
          <div className="opportunity-response" aria-label="Guest response">
            <p className="opportunity-response-label">Mark the guest response</p>
            <div className="opportunity-response-actions">
              <button type="button" className="add-incident" onClick={() => respond("done")}>
                {positiveLabel(action.category)}
              </button>
              {action.category === "guest-experience" ? null : (
                <button type="button" className="opportunity-reject" onClick={() => respond("rejected")}>
                  Rejected
                </button>
              )}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
