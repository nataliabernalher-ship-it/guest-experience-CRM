import {
  formatIncidentWhen,
  guestById,
  type ActionStatus,
  type ShiftAction,
} from "../data/shift";
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

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M2.4 6.2 4.8 8.6 9.6 3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M4.2 5.2H9a2.8 2.8 0 1 1 0 5.6H7.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.8 2.8 3.4 5.2 5.8 7.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type TimelineStep = {
  id: "created" | "notified" | "solved" | "confirmed";
  label: string;
  done: boolean;
  when?: string;
  markStatus?: Extract<ActionStatus, "notified" | "solved" | "confirmed">;
  undoStatus?: Extract<ActionStatus, "pending" | "notified" | "solved">;
};

export function IncidentDetailModal({
  action,
  onClose,
}: {
  action: ShiftAction;
  onClose: () => void;
}) {
  const { setActionStatus } = useShift();
  const guest = guestById(action.guestId);

  const steps: TimelineStep[] = [
    {
      id: "created",
      label: "Create",
      done: Boolean(action.createdAt),
      when: action.createdAt,
    },
    {
      id: "notified",
      label: "Notified",
      done: Boolean(action.notifiedAt),
      when: action.notifiedAt,
      markStatus: "notified",
      undoStatus: "pending",
    },
    {
      id: "solved",
      label: "Solved",
      done: Boolean(action.solvedAt),
      when: action.solvedAt,
      markStatus: "solved",
      undoStatus: "notified",
    },
    {
      id: "confirmed",
      label: "Confirmed with the guest",
      done: Boolean(action.confirmedAt),
      when: action.confirmedAt,
      markStatus: "confirmed",
      undoStatus: "solved",
    },
  ];

  function mark(status: Extract<ActionStatus, "notified" | "solved" | "confirmed">) {
    if (action.status === status) return;
    setActionStatus(action.id, status);
  }

  function undo(status: Extract<ActionStatus, "pending" | "notified" | "solved">) {
    setActionStatus(action.id, status);
  }

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Close" onClick={onClose} />
      <aside className="incident-modal" role="dialog" aria-labelledby="incident-detail-title">
        <header className="incident-modal-head">
          <div>
            <p className="eyebrow">Incident</p>
            <h2 id="incident-detail-title">{action.label}</h2>
          </div>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>

        <dl className="incident-facts">
          <div>
            <dt>Guest</dt>
            <dd>{guest.name}</dd>
          </div>
          <div>
            <dt>Room</dt>
            <dd>{guest.room}</dd>
          </div>
          <div>
            <dt>Title</dt>
            <dd>{action.label}</dd>
          </div>
          <div className="is-wide">
            <dt>Description</dt>
            <dd>{action.description?.trim() || action.label}</dd>
          </div>
        </dl>

        <section className="incident-timeline" aria-label="Incident timeline">
          <ol className="incident-timeline-list">
            {steps.map((step) => (
              <li key={step.id} className={step.done ? "is-done" : "is-todo"}>
                <span className={step.done ? "incident-node is-done" : "incident-node"} aria-hidden="true">
                  {step.done ? <CheckIcon /> : null}
                </span>
                <div className="incident-step">
                  <div className="incident-step-copy">
                    <span className="incident-step-label">{step.label}</span>
                    {step.done && step.when ? (
                      <strong className="incident-step-when">{formatIncidentWhen(step.when)}</strong>
                    ) : null}
                  </div>
                  <div className="incident-step-actions">
                    {step.done && step.undoStatus ? (
                      <button
                        type="button"
                        className="incident-undo"
                        aria-label={`Undo ${step.label}`}
                        onClick={() => undo(step.undoStatus!)}
                      >
                        <UndoIcon />
                      </button>
                    ) : null}
                    {!step.done && step.markStatus ? (
                      <button
                        type="button"
                        className="incident-mark"
                        onClick={() => mark(step.markStatus!)}
                      >
                        Mark as {step.id === "confirmed" ? "confirmed" : step.id}
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </aside>
    </div>
  );
}
