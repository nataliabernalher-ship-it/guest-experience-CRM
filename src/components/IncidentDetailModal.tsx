import {
  formatIncidentWhen,
  guestById,
  type ShiftAction,
} from "../data/shift";

export function IncidentDetailModal({
  action,
  onClose,
}: {
  action: ShiftAction;
  onClose: () => void;
}) {
  const guest = guestById(action.guestId);

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Close" onClick={onClose} />
      <aside className="incident-modal" role="dialog" aria-labelledby="incident-detail-title">
        <header className="incident-modal-head">
          <div>
            <p className="eyebrow">Incident</p>
            <h2 id="incident-detail-title">{action.label}</h2>
          </div>
          <button type="button" className="incident-cancel" onClick={onClose}>
            Close
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

        <section className="incident-times" aria-label="Incident timeline stamps">
          <div>
            <span>Created</span>
            <strong>{formatIncidentWhen(action.createdAt)}</strong>
          </div>
          <div>
            <span>Notified</span>
            <strong>{formatIncidentWhen(action.notifiedAt)}</strong>
          </div>
          <div>
            <span>Solved</span>
            <strong>{formatIncidentWhen(action.solvedAt)}</strong>
          </div>
          <div>
            <span>Confirmed with guest</span>
            <strong>{formatIncidentWhen(action.confirmedAt)}</strong>
          </div>
        </section>
      </aside>
    </div>
  );
}
