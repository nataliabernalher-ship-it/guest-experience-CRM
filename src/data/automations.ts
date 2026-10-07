import { worldSubregionLabels } from "./regions";
import type { Category } from "./shift";

export type AutomationStatus = "active" | "inactive";

export type AutomationCategory = Exclude<Category, "recovery">;

export type ConditionField =
  | "previous-stays"
  | "loyalty-status"
  | "previously-used-service"
  | "birthday"
  | "stay-reason"
  | "breakfast-included"
  | "room-category"
  | "guest-region"
  | "arrival-time"
  | "departure-time";

export type ConditionOperator =
  | "gte"
  | "lte"
  | "eq"
  | "neq"
  | "is"
  | "is-not"
  | "includes"
  | "does-not-include"
  | "contains"
  | "during-stay"
  | "yes"
  | "no";

export type AutomationTiming =
  | "before-check-in"
  | "at-check-in"
  | "during-stay"
  | "on-guest-event"
  | "day-before-check-out"
  | "before-check-out";

export interface AutomationCondition {
  id: string;
  field: ConditionField;
  operator: ConditionOperator;
  value: string;
}

export interface Automation {
  id: string;
  name: string;
  category: AutomationCategory;
  actionLabel: string;
  /** Valor económico por persona. Solo upselling. */
  valuePerPerson?: number;
  conditions: AutomationCondition[];
  timing: AutomationTiming;
  /** Optional details or description for reception. */
  description?: string;
  status: AutomationStatus;
}

export const conditionFields: { id: ConditionField; label: string }[] = [
  { id: "previous-stays", label: "Previous stays" },
  { id: "loyalty-status", label: "Loyalty status" },
  { id: "previously-used-service", label: "Previously used service" },
  { id: "birthday", label: "Birthday" },
  { id: "stay-reason", label: "Stay reason / reservation note" },
  { id: "breakfast-included", label: "Breakfast included" },
  { id: "room-category", label: "Room category" },
  { id: "guest-region", label: "Guest region" },
  { id: "arrival-time", label: "Arrival time" },
  { id: "departure-time", label: "Departure time" },
];

const operatorsByField: Record<ConditionField, { id: ConditionOperator; label: string }[]> = {
  "previous-stays": [
    { id: "gte", label: "is greater than or equal to" },
    { id: "lte", label: "is less than or equal to" },
    { id: "eq", label: "is equal to" },
  ],
  "loyalty-status": [
    { id: "is", label: "is" },
    { id: "is-not", label: "is not" },
  ],
  "previously-used-service": [
    { id: "includes", label: "includes" },
    { id: "does-not-include", label: "does not include" },
  ],
  birthday: [{ id: "during-stay", label: "falls during stay" }],
  "stay-reason": [
    { id: "contains", label: "contains" },
    { id: "eq", label: "is" },
  ],
  "breakfast-included": [
    { id: "yes", label: "is yes" },
    { id: "no", label: "is no" },
  ],
  "room-category": [
    { id: "is", label: "is" },
    { id: "is-not", label: "is not" },
  ],
  "guest-region": [
    { id: "is", label: "is" },
    { id: "is-not", label: "is not" },
  ],
  "arrival-time": [
    { id: "gte", label: "is at or after" },
    { id: "lte", label: "is at or before" },
  ],
  "departure-time": [
    { id: "gte", label: "is at or after" },
    { id: "lte", label: "is at or before" },
  ],
};

export function operatorsForField(field: ConditionField) {
  return operatorsByField[field];
}

export function defaultOperatorForField(field: ConditionField): ConditionOperator {
  return operatorsByField[field][0].id;
}

export function defaultValueForField(field: ConditionField): string {
  if (field === "previous-stays") return "3";
  if (field === "loyalty-status") return "Not enrolled";
  if (field === "previously-used-service") return "Spa";
  if (field === "birthday") return "";
  if (field === "stay-reason") return "";
  if (field === "breakfast-included") return "";
  if (field === "room-category") return "Deluxe";
  if (field === "guest-region") return worldSubregionLabels[0];
  if (field === "arrival-time") return "15:00";
  return "11:00";
}

export { worldSubregionLabels };

export function fieldNeedsValue(field: ConditionField, operator: ConditionOperator): boolean {
  if (field === "birthday" || field === "breakfast-included") return false;
  if (operator === "during-stay" || operator === "yes" || operator === "no") return false;
  return true;
}

export const loyaltyStatusValues = ["Enrolled", "Not enrolled"] as const;

export const serviceValues = ["Spa", "Breakfast", "Transfer", "Restaurant", "Late check-out"] as const;

export const roomCategoryValues = ["Garden room", "Superior double", "Deluxe king", "Junior suite"] as const;

export const timingOptions: { id: AutomationTiming; label: string }[] = [
  { id: "before-check-in", label: "Before check-in" },
  { id: "at-check-in", label: "At check-in" },
  { id: "during-stay", label: "During stay" },
  { id: "on-guest-event", label: "On specific guest event" },
  { id: "day-before-check-out", label: "Day before check-out" },
  { id: "before-check-out", label: "Before check-out" },
];

export const actionsByCategory: Record<AutomationCategory, string[]> = {
  upselling: [
    "Offer Spa treatment",
    "Offer Breakfast",
    "Offer Room upgrade",
    "Offer Late check-out",
    "Offer Transfer",
    "Offer Restaurant",
  ],
  loyalty: ["Invite to Loyalty program"],
  "guest-experience": [
    "Send Birthday amenity",
    "Send Anniversary amenity",
    "Send Returning Guest amenity",
  ],
};

export function automationCategoryLabel(category: AutomationCategory): string {
  if (category === "upselling") return "Upselling";
  if (category === "loyalty") return "Loyalty";
  return "Special amenities";
}

export function timingLabel(timing: AutomationTiming): string {
  return timingOptions.find((item) => item.id === timing)?.label ?? timing;
}

export function formatTimingCell(automation: Automation): string {
  if (
    automation.timing === "on-guest-event" &&
    automation.conditions.some((condition) => condition.field === "birthday")
  ) {
    return "On birthday";
  }
  return timingLabel(automation.timing);
}

function fieldLabel(field: ConditionField): string {
  return conditionFields.find((item) => item.id === field)?.label ?? field;
}

function operatorLabel(field: ConditionField, operator: ConditionOperator): string {
  return operatorsForField(field).find((item) => item.id === operator)?.label ?? operator;
}

export function formatConditionLine(condition: AutomationCondition): string {
  const field = fieldLabel(condition.field);
  if (condition.field === "birthday") return `${field} falls during stay`;
  if (condition.field === "breakfast-included") {
    return condition.operator === "no" ? `${field} is no` : `${field} is yes`;
  }
  const op = operatorLabel(condition.field, condition.operator);
  if (!fieldNeedsValue(condition.field, condition.operator)) return `${field} ${op}`;
  return `${field} ${op} ${condition.value}`.trim();
}

export function formatWhenSummary(conditions: AutomationCondition[]): string[] {
  return conditions.map(formatConditionLine);
}

export function formatThenSummary(actionLabel: string, valuePerPerson?: number): string {
  if (valuePerPerson != null && Number.isFinite(valuePerPerson)) {
    return `Create “${actionLabel}” · ${valuePerPerson}€ per person`;
  }
  return `Create “${actionLabel}”`;
}

export function defaultValuePerPerson(actionLabel: string): number {
  if (actionLabel.includes("Spa")) return 80;
  if (actionLabel.includes("Breakfast")) return 28;
  if (actionLabel.includes("upgrade") || actionLabel.includes("Upgrade")) return 60;
  if (actionLabel.includes("Late")) return 45;
  if (actionLabel.includes("Transfer")) return 65;
  if (actionLabel.includes("Restaurant")) return 40;
  return 50;
}

export function formatTimingSummary(timing: AutomationTiming): string {
  return timingLabel(timing);
}

/** Compact trigger text for the table. */
export function formatTriggerCell(conditions: AutomationCondition[]): string {
  return conditions
    .map((condition) => {
      if (condition.field === "previous-stays" && condition.operator === "gte") {
        return `${condition.value}+ previous stays`;
      }
      if (condition.field === "loyalty-status" && condition.operator === "is") {
        return condition.value;
      }
      if (condition.field === "previously-used-service" && condition.operator === "includes") {
        return `Previously used ${condition.value}`;
      }
      if (condition.field === "birthday") return "Birthday during stay";
      if (condition.field === "breakfast-included" && condition.operator === "no") {
        return "Breakfast not included";
      }
      return formatConditionLine(condition);
    })
    .join(" · ");
}

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyCondition(): AutomationCondition {
  return {
    id: newId("condition"),
    field: "previous-stays",
    operator: "gte",
    value: "3",
  };
}

export function emptyAutomationDraft(): Omit<Automation, "id" | "status"> {
  const actionLabel = actionsByCategory.upselling[0];
  return {
    name: "",
    category: "upselling",
    actionLabel,
    valuePerPerson: defaultValuePerPerson(actionLabel),
    conditions: [emptyCondition()],
    timing: "at-check-in",
    description: "",
  };
}

export const automationSeed: Automation[] = [
  {
    id: "auto-spa",
    name: "Spa upselling",
    category: "upselling",
    actionLabel: "Offer Spa treatment",
    valuePerPerson: 80,
    conditions: [
      {
        id: "auto-spa-c1",
        field: "previously-used-service",
        operator: "includes",
        value: "Spa",
      },
    ],
    timing: "at-check-in",
    description: "Mention the guest’s previous spa visit and offer a 50-minute treatment.",
    status: "active",
  },
  {
    id: "auto-loyalty",
    name: "Loyalty signup",
    category: "loyalty",
    actionLabel: "Invite to Loyalty program",
    conditions: [
      {
        id: "auto-loyalty-c1",
        field: "previous-stays",
        operator: "gte",
        value: "2",
      },
      {
        id: "auto-loyalty-c2",
        field: "loyalty-status",
        operator: "is",
        value: "Not enrolled",
      },
    ],
    timing: "at-check-in",
    description: "Explain member benefits briefly and offer to enrol at the desk.",
    status: "active",
  },
  {
    id: "auto-birthday",
    name: "Birthday amenity",
    category: "guest-experience",
    actionLabel: "Send Birthday amenity",
    conditions: [
      {
        id: "auto-birthday-c1",
        field: "birthday",
        operator: "during-stay",
        value: "",
      },
    ],
    timing: "on-guest-event",
    description: "Arrange a complimentary amenity and a handwritten birthday note in the room.",
    status: "active",
  },
  {
    id: "auto-returning",
    name: "Returning guest amenity",
    category: "guest-experience",
    actionLabel: "Send Returning Guest amenity",
    conditions: [
      {
        id: "auto-returning-c1",
        field: "previous-stays",
        operator: "gte",
        value: "3",
      },
    ],
    timing: "before-check-in",
    description: "Prepare a welcome back amenity before arrival for returning guests.",
    status: "active",
  },
  {
    id: "auto-breakfast",
    name: "Breakfast upselling",
    category: "upselling",
    actionLabel: "Offer Breakfast",
    valuePerPerson: 28,
    conditions: [
      {
        id: "auto-breakfast-c1",
        field: "breakfast-included",
        operator: "no",
        value: "",
      },
    ],
    timing: "at-check-in",
    description: "Offer breakfast for the stay when it is not included in the rate.",
    status: "active",
  },
];
