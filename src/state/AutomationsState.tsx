import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  automationSeed,
  type Automation,
  type AutomationStatus,
} from "../data/automations";

interface AutomationsStateValue {
  automations: Automation[];
  activeAutomations: Automation[];
  setStatus: (id: string, status: AutomationStatus) => void;
  upsert: (automation: Automation) => void;
  duplicate: (automation: Automation) => void;
  remove: (id: string) => void;
}

const AutomationsContext = createContext<AutomationsStateValue | null>(null);

function newAutomationId(): string {
  return `auto-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function AutomationsProvider({ children }: { children: ReactNode }) {
  const [automations, setAutomations] = useState<Automation[]>(() => automationSeed);

  const value = useMemo<AutomationsStateValue>(
    () => ({
      automations,
      activeAutomations: automations.filter((item) => item.status === "active"),
      setStatus: (id, status) => {
        setAutomations((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
      },
      upsert: (automation) => {
        setAutomations((current) => {
          const exists = current.some((item) => item.id === automation.id);
          if (exists) return current.map((item) => (item.id === automation.id ? automation : item));
          return [automation, ...current];
        });
      },
      duplicate: (automation) => {
        setAutomations((current) => [
          {
            ...automation,
            id: newAutomationId(),
            name: `${automation.name} (copy)`,
            status: "active",
            conditions: automation.conditions.map((condition) => ({
              ...condition,
              id: `condition-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            })),
          },
          ...current,
        ]);
      },
      remove: (id) => {
        setAutomations((current) => current.filter((item) => item.id !== id));
      },
    }),
    [automations],
  );

  return <AutomationsContext.Provider value={value}>{children}</AutomationsContext.Provider>;
}

export function useAutomations() {
  const value = useContext(AutomationsContext);
  if (!value) throw new Error("useAutomations must be used within AutomationsProvider");
  return value;
}

export function createAutomationId(): string {
  return newAutomationId();
}
