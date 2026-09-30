import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { actions as seed, type ActionStatus, type ShiftAction } from "../data/shift";

interface ShiftStateValue {
  actions: ShiftAction[];
  setActionStatus: (id: string, status: ActionStatus) => void;
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
