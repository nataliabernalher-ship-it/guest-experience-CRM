import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  actions as seed,
  guestById,
  listingForMoment,
  type ActionStatus,
  type Category,
  type GuestNote,
  type Severity,
  type ShiftAction,
} from "../data/shift";

interface NewIncident {
  guestId: string;
  label: string;
  severity: Severity;
}

interface NewOpportunity {
  guestId: string;
  category: Exclude<Category, "recovery">;
  label: string;
  value?: number;
}

interface ShiftStateValue {
  actions: ShiftAction[];
  setActionStatus: (id: string, status: ActionStatus) => void;
  addIncident: (incident: NewIncident) => void;
  addOpportunity: (opportunity: NewOpportunity) => void;
  addGuestNote: (guestId: string, text: string) => void;
  notesByGuest: Record<string, GuestNote[]>;
}

const ShiftContext = createContext<ShiftStateValue | null>(null);

export function ShiftProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ShiftAction[]>(seed);
  const [notesByGuest, setNotesByGuest] = useState<Record<string, GuestNote[]>>({});
  const value = useMemo(
    () => ({
      actions,
      notesByGuest,
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
      addOpportunity: ({ guestId, category, label, value }: NewOpportunity) => {
        const text = label.trim();
        if (!guestId || !text) return;
        const guest = guestById(guestId);
        setActions((current) => [
          {
            id: `opportunity-${crypto.randomUUID()}`,
            guestId,
            category,
            label: text,
            listing: listingForMoment(guest.moment),
            proximity: 1,
            timingLabel: "Today",
            value: category === "upselling" ? value : undefined,
            status: "pending",
          },
          ...current,
        ]);
      },
      addGuestNote: (guestId: string, text: string) => {
        const note = text.trim();
        if (!guestId || !note) return;
        setNotesByGuest((current) => ({
          ...current,
          [guestId]: [
            ...(current[guestId] ?? []),
            { text: note, author: "Receptionist", date: "30 Sep 2026" },
          ],
        }));
      },
    }),
    [actions, notesByGuest],
  );

  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
}

export function useShift(): ShiftStateValue {
  const value = useContext(ShiftContext);
  if (!value) throw new Error("useShift must be used within ShiftProvider");
  return value;
}
