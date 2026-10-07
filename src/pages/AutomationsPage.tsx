import { useEffect, useMemo, useState } from "react";
import {
  actionsByCategory,
  automationCategoryLabel,
  automationSeed,
  defaultOperatorForField,
  defaultValueForField,
  defaultValuePerPerson,
  emptyAutomationDraft,
  emptyCondition,
  fieldNeedsValue,
  formatThenSummary,
  formatTimingCell,
  formatTimingSummary,
  formatTriggerCell,
  formatWhenSummary,
  loyaltyStatusValues,
  operatorsForField,
  roomCategoryValues,
  serviceValues,
  timingOptions,
  conditionFields,
  type Automation,
  type AutomationCategory,
  type AutomationCondition,
  type AutomationStatus,
  type AutomationTiming,
  type ConditionField,
  type ConditionOperator,
} from "../data/automations";
import { money } from "../data/shift";
import { CategoryPill } from "../components/CategoryPill";

type Draft = {
  name: string;
  category: AutomationCategory;
  actionLabel: string;
  valuePerPerson: string;
  conditions: AutomationCondition[];
  timing: AutomationTiming;
};

function toDraft(automation: Automation): Draft {
  return {
    name: automation.name,
    category: automation.category,
    actionLabel: automation.actionLabel,
    valuePerPerson:
      automation.valuePerPerson != null
        ? String(automation.valuePerPerson)
        : automation.category === "upselling"
          ? String(defaultValuePerPerson(automation.actionLabel))
          : "",
    conditions: automation.conditions.map((condition) => ({ ...condition })),
    timing: automation.timing,
  };
}

function valueOptionsFor(field: ConditionField): string[] | null {
  if (field === "loyalty-status") return [...loyaltyStatusValues];
  if (field === "previously-used-service") return [...serviceValues];
  if (field === "room-category") return [...roomCategoryValues];
  return null;
}

export function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>(() => automationSeed);
  const [drawerMode, setDrawerMode] = useState<"closed" | "create" | "edit">("closed");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => {
    const base = emptyAutomationDraft();
    return {
      ...base,
      valuePerPerson: base.valuePerPerson != null ? String(base.valuePerPerson) : "",
    };
  });

  useEffect(() => {
    document.title = "Automations · Guest Experience";
  }, []);

  const editing = useMemo(
    () => (editingId == null ? null : automations.find((item) => item.id === editingId) ?? null),
    [automations, editingId],
  );

  function openCreate() {
    setEditingId(null);
    const base = emptyAutomationDraft();
    setDraft({
      ...base,
      valuePerPerson: base.valuePerPerson != null ? String(base.valuePerPerson) : "",
    });
    setDrawerMode("create");
  }

  function openEdit(automation: Automation) {
    setEditingId(automation.id);
    setDraft(toDraft(automation));
    setDrawerMode("edit");
  }

  function closeDrawer() {
    setDrawerMode("closed");
    setEditingId(null);
  }

  function setStatus(id: string, status: AutomationStatus) {
    setAutomations((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  function duplicate(automation: Automation) {
    setAutomations((current) => [
      {
        ...automation,
        id: `auto-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: `${automation.name} (copy)`,
        status: "active",
        conditions: automation.conditions.map((condition) => ({
          ...condition,
          id: `condition-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        })),
      },
      ...current,
    ]);
  }

  function remove(id: string) {
    setAutomations((current) => current.filter((item) => item.id !== id));
    if (editingId === id) closeDrawer();
  }

  function save() {
    const name = draft.name.trim() || draft.actionLabel;
    const actionLabel = draft.actionLabel.trim();
    if (!actionLabel || draft.conditions.length === 0) return;
    const parsedValue = Number(draft.valuePerPerson);
    const valuePerPerson =
      draft.category === "upselling" && Number.isFinite(parsedValue) && parsedValue >= 0
        ? parsedValue
        : undefined;
    if (draft.category === "upselling" && valuePerPerson == null) return;

    const payload = {
      name,
      category: draft.category,
      actionLabel,
      valuePerPerson,
      conditions: draft.conditions,
      timing: draft.timing,
    };

    if (drawerMode === "edit" && editingId) {
      setAutomations((current) =>
        current.map((item) => (item.id === editingId ? { ...item, ...payload } : item)),
      );
    } else {
      setAutomations((current) => [
        {
          id: `auto-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          ...payload,
          status: "active",
        },
        ...current,
      ]);
    }
    closeDrawer();
  }

  const upsellValueOk =
    draft.category !== "upselling" ||
    (draft.valuePerPerson.trim() !== "" && Number.isFinite(Number(draft.valuePerPerson)) && Number(draft.valuePerPerson) >= 0);
  const ready = draft.actionLabel.trim().length > 0 && draft.conditions.length > 0 && upsellValueOk;

  return (
    <div className="page" data-testid="automations">
      <header className="page-header">
        <h1>Automations</h1>
        <p className="lede">Create rules that turn guest data into actions for your team.</p>
      </header>

      <div className="automations-toolbar">
        <span className="automations-count">
          {automations.length} {automations.length === 1 ? "automation" : "automations"}
        </span>
        <button type="button" className="add-incident" onClick={openCreate}>
          + Create automation
        </button>
      </div>

      {automations.length === 0 ? (
        <p className="automations-empty">No automations yet.</p>
      ) : (
        <ul className="automations-grid">
          {automations.map((automation) => (
            <li
              key={automation.id}
              className={
                automation.status === "inactive" ? "automation-card is-inactive" : "automation-card"
              }
            >
              <header className="automation-card-head">
                <h2>{automation.name}</h2>
                <CategoryPill category={automation.category} />
              </header>
              <dl className="automation-card-facts">
                <div>
                  <dt>Trigger</dt>
                  <dd>{formatTriggerCell(automation.conditions)}</dd>
                </div>
                <div>
                  <dt>Timing</dt>
                  <dd>{formatTimingCell(automation)}</dd>
                </div>
                {automation.category === "upselling" && automation.valuePerPerson != null ? (
                  <div>
                    <dt>Value per person</dt>
                    <dd>{money.format(automation.valuePerPerson)}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="automation-card-foot">
                <select
                  className="status-select"
                  aria-label={`Status for ${automation.name}`}
                  value={automation.status}
                  onChange={(event) => setStatus(automation.id, event.target.value as AutomationStatus)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <div className="row-actions">
                  <button type="button" className="row-action" onClick={() => openEdit(automation)}>
                    Edit
                  </button>
                  <button type="button" className="row-action" onClick={() => duplicate(automation)}>
                    Duplicate
                  </button>
                  <button type="button" className="row-action is-danger" onClick={() => remove(automation.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {drawerMode !== "closed" ? (
        <AutomationBuilderDrawer
          mode={drawerMode}
          draft={draft}
          title={drawerMode === "edit" ? (editing?.name ?? "Edit automation") : "Create automation"}
          ready={ready}
          onChange={setDraft}
          onClose={closeDrawer}
          onSave={save}
        />
      ) : null}
    </div>
  );
}

function AutomationBuilderDrawer({
  mode,
  draft,
  title,
  ready,
  onChange,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  draft: Draft;
  title: string;
  ready: boolean;
  onChange: (draft: Draft) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const whenLines = formatWhenSummary(draft.conditions);
  const parsedDraftValue = Number(draft.valuePerPerson);
  const thenLine = formatThenSummary(
    draft.actionLabel || "an opportunity",
    draft.category === "upselling" && Number.isFinite(parsedDraftValue) ? parsedDraftValue : undefined,
  );
  const atLine = formatTimingSummary(draft.timing);
  const actions = actionsByCategory[draft.category];

  function updateCondition(id: string, patch: Partial<AutomationCondition>) {
    onChange({
      ...draft,
      conditions: draft.conditions.map((condition) => {
        if (condition.id !== id) return condition;
        const next = { ...condition, ...patch };
        if (patch.field && patch.field !== condition.field) {
          next.operator = defaultOperatorForField(patch.field);
          next.value = defaultValueForField(patch.field);
        }
        return next;
      }),
    });
  }

  function addCondition() {
    onChange({ ...draft, conditions: [...draft.conditions, emptyCondition()] });
  }

  function removeCondition(id: string) {
    if (draft.conditions.length <= 1) return;
    onChange({ ...draft, conditions: draft.conditions.filter((condition) => condition.id !== id) });
  }

  function setCategory(category: AutomationCategory) {
    const actionLabel = actionsByCategory[category][0];
    onChange({
      ...draft,
      category,
      actionLabel,
      valuePerPerson:
        category === "upselling" ? String(defaultValuePerPerson(actionLabel)) : "",
    });
  }

  return (
    <div className="drawer-root">
      <button type="button" className="drawer-backdrop" aria-label="Close" onClick={onClose} />
      <aside className="drawer is-wide" role="dialog" aria-labelledby="automation-builder-title">
        <header className="drawer-head">
          <div>
            <p className="eyebrow">{mode === "edit" ? "Edit" : "New"}</p>
            <h2 id="automation-builder-title">{title}</h2>
          </div>
          <button type="button" className="incident-cancel" onClick={onClose}>
            Cancel
          </button>
        </header>

        <label className="drawer-field">
          Automation name
          <input
            className="incident-input"
            aria-label="Automation name"
            placeholder="e.g. Loyalty signup"
            value={draft.name}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
          />
        </label>

        <section className="rule-section" aria-labelledby="when-heading">
          <h3 id="when-heading">WHEN</h3>
          <p className="rule-prompt">When should this automation run?</p>
          <div className="condition-list">
            {draft.conditions.map((condition, index) => (
              <div key={condition.id} className="condition-row">
                {index > 0 ? <span className="condition-and">AND</span> : null}
                <div className="condition-controls">
                  <label className="drawer-field">
                    Guest data
                    <select
                      className="status-select"
                      aria-label="Condition field"
                      value={condition.field}
                      onChange={(event) =>
                        updateCondition(condition.id, { field: event.target.value as ConditionField })
                      }
                    >
                      {conditionFields.map((field) => (
                        <option key={field.id} value={field.id}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="drawer-field">
                    Match
                    <select
                      className="status-select"
                      aria-label="Condition operator"
                      value={condition.operator}
                      onChange={(event) =>
                        updateCondition(condition.id, { operator: event.target.value as ConditionOperator })
                      }
                    >
                      {operatorsForField(condition.field).map((operator) => (
                        <option key={operator.id} value={operator.id}>
                          {operator.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {fieldNeedsValue(condition.field, condition.operator) ? (
                    <label className="drawer-field">
                      Value
                      {valueOptionsFor(condition.field) ? (
                        <select
                          className="status-select"
                          aria-label="Condition value"
                          value={condition.value}
                          onChange={(event) => updateCondition(condition.id, { value: event.target.value })}
                        >
                          {valueOptionsFor(condition.field)!.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="incident-input"
                          aria-label="Condition value"
                          value={condition.value}
                          onChange={(event) => updateCondition(condition.id, { value: event.target.value })}
                        />
                      )}
                    </label>
                  ) : null}
                  {draft.conditions.length > 1 ? (
                    <button
                      type="button"
                      className="row-action is-danger"
                      onClick={() => removeCondition(condition.id)}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="rule-add" onClick={addCondition}>
            + Add condition
          </button>
        </section>

        <section className="rule-section" aria-labelledby="then-heading">
          <h3 id="then-heading">THEN</h3>
          <p className="rule-prompt">What should reception do?</p>
          <div className="then-grid">
            <label className="drawer-field">
              Category
              <select
                className="status-select"
                aria-label="Opportunity category"
                value={draft.category}
                onChange={(event) => setCategory(event.target.value as AutomationCategory)}
              >
                <option value="upselling">Upselling</option>
                <option value="loyalty">Loyalty</option>
                <option value="guest-experience">Special amenities</option>
              </select>
            </label>
            <label className="drawer-field">
              Action
              <select
                className="status-select"
                aria-label="Opportunity action"
                value={draft.actionLabel}
                onChange={(event) => {
                  const actionLabel = event.target.value;
                  onChange({
                    ...draft,
                    actionLabel,
                    valuePerPerson:
                      draft.category === "upselling"
                        ? String(defaultValuePerPerson(actionLabel))
                        : draft.valuePerPerson,
                  });
                }}
              >
                {actions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </label>
            {draft.category === "upselling" ? (
              <label className="drawer-field">
                Value per person (€)
                <input
                  className="incident-input"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="decimal"
                  aria-label="Value per person"
                  placeholder="e.g. 80"
                  value={draft.valuePerPerson}
                  onChange={(event) => onChange({ ...draft, valuePerPerson: event.target.value })}
                />
              </label>
            ) : null}
          </div>
          <p className="rule-note">This creates an opportunity for reception to act on — it does not contact the guest.</p>
        </section>

        <section className="rule-section" aria-labelledby="timing-heading">
          <h3 id="timing-heading">TIMING</h3>
          <p className="rule-prompt">When should reception act?</p>
          <label className="drawer-field">
            Timing
            <select
              className="status-select"
              aria-label="Timing"
              value={draft.timing}
              onChange={(event) => onChange({ ...draft, timing: event.target.value as AutomationTiming })}
            >
              {timingOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="rule-summary" aria-label="Rule summary">
          <h3>Rule summary</h3>
          <div className="rule-summary-body">
            <p className="rule-summary-label">WHEN</p>
            {whenLines.map((line, index) => (
              <p key={`${line}-${index}`} className="rule-summary-line">
                {index > 0 ? <span className="condition-and">AND</span> : null}
                {line}
              </p>
            ))}
            <p className="rule-summary-label">THEN</p>
            <p className="rule-summary-line">{thenLine}</p>
            <p className="rule-summary-label">AT</p>
            <p className="rule-summary-line">{atLine}</p>
          </div>
          <p className="rule-summary-hint">
            {automationCategoryLabel(draft.category)} opportunity · guest data match · reception acts
          </p>
        </section>

        <div className="drawer-actions">
          <button type="button" className="incident-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="add-incident" disabled={!ready} onClick={onSave}>
            Save automation
          </button>
        </div>
      </aside>
    </div>
  );
}
