import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  actionsByCategory,
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
  worldSubregionLabels,
} from "../data/automations";
import { subregionsForContinent, worldContinents } from "../data/regions";
import { money } from "../data/shift";
import { CategoryPill } from "../components/CategoryPill";
import { EmptyState, ErrorState, LoadingState } from "../components/ViewState";
import { useViewLoad } from "../hooks/useViewLoad";
import { createAutomationId, useAutomations } from "../state/AutomationsState";

type Draft = {
  name: string;
  category: AutomationCategory;
  actionLabel: string;
  valuePerPerson: string;
  conditions: AutomationCondition[];
  timing: AutomationTiming;
  description: string;
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
    description: automation.description ?? "",
  };
}

function valueOptionsFor(field: ConditionField): string[] | null {
  if (field === "loyalty-status") return [...loyaltyStatusValues];
  if (field === "previously-used-service") return [...serviceValues];
  if (field === "room-category") return [...roomCategoryValues];
  if (field === "guest-region") return [...worldSubregionLabels];
  return null;
}

function regionOptionGroups() {
  return worldContinents.map((continent) => ({
    label: continent.label,
    options: subregionsForContinent(continent.id).map((item) => item.label),
  }));
}

function ActionCombobox({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string, fromOption: boolean) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const filtered = options.filter((option) =>
    option.toLowerCase().includes(value.trim().toLowerCase()),
  );
  const suggestions = value.trim() ? filtered : options;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div className="action-combobox" ref={rootRef}>
      <input
        className="incident-input"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label="Opportunity action"
        placeholder="Type or select an action"
        value={value}
        onChange={(event) => {
          onChange(event.target.value, false);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "ArrowDown") setOpen(true);
        }}
      />
      {open && suggestions.length > 0 ? (
        <ul className="action-combobox-list" id={listId} role="listbox">
          {suggestions.map((option) => (
            <li key={option} role="option" aria-selected={option === value}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option, true);
                  setOpen(false);
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function emptyDraft(): Draft {
  const base = emptyAutomationDraft();
  return {
    ...base,
    valuePerPerson: base.valuePerPerson != null ? String(base.valuePerPerson) : "",
    description: base.description ?? "",
  };
}

export function AutomationsPage() {
  const navigate = useNavigate();
  const {
    automations,
    setStatus,
    duplicate,
    remove: removeAutomation,
  } = useAutomations();
  const { status, retry } = useViewLoad("automations");

  useEffect(() => {
    document.title = "Automations · Guest Experience";
  }, []);

  return (
    <div className="page" data-testid="automations">
      <header className="page-header is-split">
        <div className="page-header-bar">
          <h1>Automations</h1>
          <Link to="/automations/new" className="add-incident page-header-action">
            Create automation
          </Link>
        </div>
      </header>

      {status === "loading" ? (
        <div className="page-view-state">
          <LoadingState
            title="Loading automations"
            description="We’re loading your automation rules so reception can act on guest signals."
          />
        </div>
      ) : status === "error" ? (
        <div className="page-view-state">
          <ErrorState
            title="Couldn’t load automations"
            description="The automation list didn’t load. Try again, or create a new rule while we recover."
            action={
              <>
                <button type="button" className="add-incident" onClick={retry}>
                  Try again
                </button>
                <Link to="/automations/new" className="add-incident">
                  Create automation
                </Link>
              </>
            }
          />
        </div>
      ) : automations.length === 0 ? (
        <div className="page-view-state">
          <EmptyState
            title="No automations yet"
            description="Create a rule to turn guest data into opportunities for reception. Start with one clear WHEN / THEN condition."
            action={
              <Link to="/automations/new" className="add-incident">
                Create automation
              </Link>
            }
          />
        </div>
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
                  <button
                    type="button"
                    className="row-action"
                    onClick={() => navigate(`/automations/${automation.id}`)}
                  >
                    Edit
                  </button>
                  <button type="button" className="row-action" onClick={() => duplicate(automation)}>
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="row-action is-danger"
                    onClick={() => removeAutomation(automation.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AutomationBuilderPage() {
  const navigate = useNavigate();
  const { automationId } = useParams();
  const { automations, upsert } = useAutomations();
  const editing = useMemo(
    () => (automationId ? automations.find((item) => item.id === automationId) ?? null : null),
    [automations, automationId],
  );
  const isCreate = !automationId;
  const [draft, setDraft] = useState<Draft>(() =>
    editing ? toDraft(editing) : emptyDraft(),
  );
  const [hydratedId, setHydratedId] = useState<string | null>(editing?.id ?? null);

  useEffect(() => {
    if (isCreate) {
      setDraft(emptyDraft());
      setHydratedId(null);
      document.title = "Create a new automation · Guest Experience";
      return;
    }
    if (editing && editing.id !== hydratedId) {
      setDraft(toDraft(editing));
      setHydratedId(editing.id);
    }
    document.title = editing
      ? `${editing.name} · Automations · Guest Experience`
      : "Automation · Guest Experience";
  }, [editing, hydratedId, isCreate]);

  const whenLines = formatWhenSummary(draft.conditions);
  const parsedDraftValue = Number(draft.valuePerPerson);
  const thenLine = formatThenSummary(
    draft.actionLabel || "an opportunity",
    draft.category === "upselling" && Number.isFinite(parsedDraftValue) ? parsedDraftValue : undefined,
  );
  const atLine = formatTimingSummary(draft.timing);
  const actions = actionsByCategory[draft.category];
  const upsellValueOk =
    draft.category !== "upselling" ||
    (draft.valuePerPerson.trim() !== "" &&
      Number.isFinite(Number(draft.valuePerPerson)) &&
      Number(draft.valuePerPerson) >= 0);
  const ready = draft.actionLabel.trim().length > 0 && draft.conditions.length > 0 && upsellValueOk;
  const title = isCreate ? "Create a new automation" : (editing?.name ?? "Edit automation");

  function goBack() {
    navigate("/automations");
  }

  function updateCondition(id: string, patch: Partial<AutomationCondition>) {
    setDraft((current) => ({
      ...current,
      conditions: current.conditions.map((condition) => {
        if (condition.id !== id) return condition;
        const next = { ...condition, ...patch };
        if (patch.field && patch.field !== condition.field) {
          next.operator = defaultOperatorForField(patch.field);
          next.value = defaultValueForField(patch.field);
        }
        return next;
      }),
    }));
  }

  function addCondition() {
    setDraft((current) => ({ ...current, conditions: [...current.conditions, emptyCondition()] }));
  }

  function removeCondition(id: string) {
    setDraft((current) => {
      if (current.conditions.length <= 1) return current;
      return { ...current, conditions: current.conditions.filter((condition) => condition.id !== id) };
    });
  }

  function setCategory(category: AutomationCategory) {
    const actionLabel = actionsByCategory[category][0];
    setDraft((current) => ({
      ...current,
      category,
      actionLabel,
      valuePerPerson: category === "upselling" ? String(defaultValuePerPerson(actionLabel)) : "",
    }));
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

    const description = draft.description.trim();
    const payload = {
      name,
      category: draft.category,
      actionLabel,
      valuePerPerson,
      conditions: draft.conditions,
      timing: draft.timing,
      description: description || undefined,
      status: (editing?.status ?? "active") as AutomationStatus,
    };

    if (!isCreate && editing) {
      upsert({ id: editing.id, ...payload });
    } else {
      upsert({
        id: createAutomationId(),
        ...payload,
        status: "active",
      });
    }
    goBack();
  }

  if (!isCreate && !editing) {
    return (
      <div className="page automation-builder-page" data-testid="automation-builder">
        <header className="page-header automation-builder-page-head">
          <div className="page-header-bar">
            <Link to="/automations" className="listing-back">
              <BackArrow />
              Back to automations
            </Link>
          </div>
        </header>
        <div className="page-view-state">
          <ErrorState
            title="Automation not found"
            description="This automation id isn’t in the current list. Go back and choose another rule."
            action={
              <Link to="/automations" className="view-all">
                Back to automations
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page automation-builder-page" data-testid="automation-builder">
      <header className="page-header automation-builder-page-head">
        <div className="page-header-bar">
          <Link to="/automations" className="listing-back">
            <BackArrow />
            Back to automations
          </Link>
        </div>
      </header>

      <div className="automation-builder">
        <header className="automation-builder-head">
          <h1 id="automation-builder-title">{title}</h1>
        </header>

        <div className="automation-builder-body">
          <section className="rule-section automation-builder-basics" aria-labelledby="basics-heading">
            <h3 id="basics-heading">1. AUTOMATION</h3>
            <label className="drawer-field automation-builder-name">
              Automation name
              <input
                className="incident-input"
                aria-label="Automation name"
                placeholder="e.g. Loyalty signup"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </label>
            <label className="drawer-field">
              Details or description
              <textarea
                className="incident-input is-area"
                aria-label="Details or description"
                placeholder="Write details or a description"
                rows={2}
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </label>
          </section>

          <section className="rule-section" aria-labelledby="timing-heading">
            <h3 id="timing-heading">2. TIMING</h3>
            <p className="rule-prompt">When should reception act?</p>
            <select
              className="status-select automation-timing-select"
              aria-label="Timing"
              value={draft.timing}
              onChange={(event) =>
                setDraft({ ...draft, timing: event.target.value as AutomationTiming })
              }
            >
              {timingOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </section>

          <section className="rule-section" aria-labelledby="when-heading">
            <h3 id="when-heading">3. WHEN</h3>
            <p className="rule-prompt">When should this automation run?</p>
            <div className="condition-list">
              {draft.conditions.map((condition, index) => (
                <div key={condition.id} className="condition-row">
                  {index > 0 ? <span className="condition-and">AND</span> : null}
                  <div className="condition-controls">
                    <div className="condition-fields">
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
                            updateCondition(condition.id, {
                              operator: event.target.value as ConditionOperator,
                            })
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
                              onChange={(event) =>
                                updateCondition(condition.id, { value: event.target.value })
                              }
                            >
                              {condition.field === "guest-region"
                                ? regionOptionGroups().map((group) => (
                                    <optgroup key={group.label} label={group.label}>
                                      {group.options.map((value) => (
                                        <option key={value} value={value}>
                                          {value}
                                        </option>
                                      ))}
                                    </optgroup>
                                  ))
                                : valueOptionsFor(condition.field)!.map((value) => (
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
                              onChange={(event) =>
                                updateCondition(condition.id, { value: event.target.value })
                              }
                            />
                          )}
                        </label>
                      ) : null}
                    </div>
                    {draft.conditions.length > 1 ? (
                      <button
                        type="button"
                        className="condition-remove"
                        aria-label="Remove condition"
                        onClick={() => removeCondition(condition.id)}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                          <path
                            d="M2.5 2.5l7 7M9.5 2.5l-7 7"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
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
            <h3 id="then-heading">4. THEN</h3>
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
                <ActionCombobox
                  value={draft.actionLabel}
                  options={actions}
                  onChange={(actionLabel, fromOption) => {
                    setDraft({
                      ...draft,
                      actionLabel,
                      valuePerPerson:
                        draft.category === "upselling" && fromOption
                          ? String(defaultValuePerPerson(actionLabel))
                          : draft.valuePerPerson,
                    });
                  }}
                />
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
                    onChange={(event) => setDraft({ ...draft, valuePerPerson: event.target.value })}
                  />
                </label>
              ) : null}
            </div>
            <p className="rule-note">
              This creates an opportunity for reception to act on — it does not contact the guest.
            </p>
          </section>

          <section className="rule-summary automation-builder-summary" aria-label="Rule summary">
            <h3>5. RULE SUMMARY</h3>
            <div className="rule-summary-body is-horizontal">
              <div className="rule-summary-block">
                <span className="rule-summary-label">WHEN</span>
                <p className="rule-summary-line">
                  {whenLines.map((line, index) => (
                    <span key={`${line}-${index}`}>
                      {index > 0 ? <span className="condition-and"> AND </span> : null}
                      {line}
                    </span>
                  ))}
                </p>
              </div>
              <div className="rule-summary-block">
                <span className="rule-summary-label">THEN</span>
                <p className="rule-summary-line">{thenLine}</p>
              </div>
              <div className="rule-summary-block">
                <span className="rule-summary-label">AT</span>
                <p className="rule-summary-line">{atLine}</p>
              </div>
              {draft.description.trim() ? (
                <div className="rule-summary-block">
                  <span className="rule-summary-label">DETAILS</span>
                  <p className="rule-summary-line is-soft">{draft.description.trim()}</p>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="automation-builder-actions">
          <button type="button" className="incident-cancel" onClick={goBack}>
            Cancel
          </button>
          <button type="button" className="add-incident" disabled={!ready} onClick={save}>
            Save automation
          </button>
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
