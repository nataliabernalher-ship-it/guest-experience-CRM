import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { actions as seed, type ActionStatus, type Severity, type ShiftAction } from "../data/shift";

interface NewIncident {
  guestId: string;
  label: string;
  severity: Severity;
}

interface ShiftStateValue {
  actions: ShiftAction[];
  setActionStatus: (id: string, status: ActionStatus) => void;
  addIncident: (incident: NewIncident) => void;
}

const ShiftContext = createContext<ShiftStateValue | null>(null);

export function ShiftProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ShiftAction[]>(seed);
  const value = useMemo(
    () => ({
      actions,
      setActionStatus: (id: string, status: ActionStatus) => {
        setActions((current) =>
          current.map((action) => {
            if (action.id !== id) return action;
            const deferToInHouse =
              status === "pending" &&
              action.category !== "recovery" &&
              (action.listing === "check-ins" || action.listing === "check-outs");
            return {
              ...action,
              status,
              listing: deferToInHouse ? "in-house" : action.listing,
            };
          }),
        );
      },
      addIncident: ({ guestId, label, severity }: NewIncident) => {
        const text = label.trim();
        if (!guestId || !text) return;
        setActions((current) => [
          {
            id: `incident-${crypto.randomUUID()}`,
            guestId,
            category: "recovery",
            label: text,
            listing: "recovery",
            severity,
            proximity: 1,
            timingLabel: "Today",
            status: "pending",
          },
          ...current,
        ]);
      },
    }),
    [actions],
  );

  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
}

export function useShift(): ShiftStateValue {
  const value = useContext(ShiftContext);
  if (!value) throw new Error("useShift must be used within ShiftProvider");
  return value;
}
