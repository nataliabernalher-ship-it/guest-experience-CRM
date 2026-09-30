export type ListingId = "check-ins" | "check-outs" | "in-house" | "recovery";

export type Category = "upselling" | "loyalty" | "guest-experience" | "recovery";

export type Severity = "urgent" | "normal" | "low";

export type StayMoment = "check-in" | "check-out" | "in-house";

export type ActionStatus = "pending" | "done" | "rejected";

export interface Guest {
  id: string;
  name: string;
  room: string;
  moment: StayMoment;
  /** Estancias anteriores a la actual. 0 significa primera visita. */
  previousStays: number;
  vip: boolean;
}

export interface ShiftAction {
  id: string;
  guestId: string;
  category: Category;
  label: string;
  listing: ListingId;
  severity?: Severity;
  /** Lower means sooner. Compared only after Recovery severity. */
  proximity: number;
  timingLabel: string;
  status: ActionStatus;
}

export interface Listing {
  id: ListingId;
  path: string;
  title: string;
  unit: string;
  moment?: StayMoment;
}

export const shiftDay = new Date(2026, 8, 30);

export const last7Days = {
  upsellingRevenue: 840,
  loyaltySignUps: 6,
  guestsPampered: 11,
};

export const listings: Record<ListingId, Listing> = {
  "check-ins": {
    id: "check-ins",
    path: "/check-ins",
    title: "Check-ins",
    unit: "arrivals",
    moment: "check-in",
  },
  "check-outs": {
    id: "check-outs",
    path: "/check-outs",
    title: "Check-outs",
    unit: "departures",
    moment: "check-out",
  },
  "in-house": {
    id: "in-house",
    path: "/in-house",
    title: "In-house",
    unit: "in house",
    moment: "in-house",
  },
  recovery: {
    id: "recovery",
    path: "/recovery",
    title: "Recovery",
    unit: "incidents",
  },
};

export const categoryLabels: Record<Category, string> = {
  upselling: "Upselling",
  loyalty: "Loyalty",
  "guest-experience": "Guest Experience",
  recovery: "Recovery",
};

export const guests: Guest[] = [
  { id: "laura", name: "Laura Martín", room: "302", moment: "check-in", previousStays: 4, vip: true },
  { id: "james", name: "James Okonkwo", room: "214", moment: "check-in", previousStays: 0, vip: false },
  { id: "paul", name: "Paul Adeyemi", room: "108", moment: "check-in", previousStays: 0, vip: false },
  { id: "elena", name: "Elena Varga", room: "221", moment: "check-out", previousStays: 3, vip: false },
  { id: "amira", name: "Amira Hassan", room: "118", moment: "check-out", previousStays: 0, vip: false },
  { id: "sofia", name: "Sofia Ricci", room: "305", moment: "in-house", previousStays: 2, vip: true },
  { id: "tom", name: "Tom Becker", room: "510", moment: "in-house", previousStays: 0, vip: false },
  { id: "kenji", name: "Kenji Sato", room: "418", moment: "in-house", previousStays: 6, vip: true },
  { id: "nina", name: "Nina Kowalski", room: "330", moment: "in-house", previousStays: 1, vip: false },
];

export function returningGuests(source: Guest[] = guests): Guest[] {
  return source
    .filter((guest) => guest.previousStays >= 1)
    .sort((a, b) => Number(b.vip) - Number(a.vip) || b.previousStays - a.previousStays);
}

const actionSeed: Omit<ShiftAction, "status">[] = [
  {
    id: "sofia-ac",
    guestId: "sofia",
    category: "recovery",
    label: "Follow up on the air conditioning",
    listing: "recovery",
    severity: "urgent",
    proximity: 3,
    timingLabel: "Later today",
  },
  {
    id: "amira-noise",
    guestId: "amira",
    category: "recovery",
    label: "Follow up on the noise complaint",
    listing: "recovery",
    severity: "normal",
    proximity: 0,
    timingLabel: "This morning",
  },
  {
    id: "tom-minibar",
    guestId: "tom",
    category: "recovery",
    label: "Follow up on the minibar charge",
    listing: "recovery",
    severity: "low",
    proximity: 0,
    timingLabel: "This morning",
  },
  {
    id: "james-transfer",
    guestId: "james",
    category: "upselling",
    label: "Offer airport transfer",
    listing: "check-ins",
    proximity: 0,
    timingLabel: "This morning",
  },
  {
    id: "laura-spa",
    guestId: "laura",
    category: "upselling",
    label: "Offer a spa massage",
    listing: "check-ins",
    proximity: 1,
    timingLabel: "Today",
  },
  {
    id: "kenji-birthday",
    guestId: "kenji",
    category: "guest-experience",
    label: "Birthday detail",
    listing: "in-house",
    proximity: 2,
    timingLabel: "Today",
  },
  {
    id: "elena-late",
    guestId: "elena",
    category: "upselling",
    label: "Offer late check-out",
    listing: "check-outs",
    proximity: 2,
    timingLabel: "Today",
  },
  {
    id: "laura-loyalty",
    guestId: "laura",
    category: "loyalty",
    label: "Invite to the loyalty programme",
    listing: "check-ins",
    proximity: 2,
    timingLabel: "Today",
  },
  {
    id: "paul-birthday",
    guestId: "paul",
    category: "guest-experience",
    label: "Birthday detail",
    listing: "check-ins",
    proximity: 4,
    timingLabel: "Today",
  },
  {
    id: "amira-birthday",
    guestId: "amira",
    category: "guest-experience",
    label: "Birthday detail",
    listing: "check-outs",
    proximity: 4,
    timingLabel: "Today",
  },
  {
    id: "sofia-welcome",
    guestId: "sofia",
    category: "guest-experience",
    label: "VIP welcome gift",
    listing: "in-house",
    proximity: 4,
    timingLabel: "Today",
  },
  {
    id: "tom-birthday",
    guestId: "tom",
    category: "guest-experience",
    label: "Birthday detail",
    listing: "in-house",
    proximity: 4,
    timingLabel: "Today",
  },
  {
    id: "nina-anniversary",
    guestId: "nina",
    category: "guest-experience",
    label: "Anniversary detail",
    listing: "in-house",
    proximity: 4,
    timingLabel: "Today",
  },
];

export const actions: ShiftAction[] = actionSeed.map((action) => ({ ...action, status: "pending" }));

const severityRank: Record<Severity, number> = {
  urgent: 0,
  normal: 1,
  low: 2,
};

export function actionSeverityRank(action: ShiftAction): number {
  if (action.category !== "recovery" || !action.severity) return 3;
  return severityRank[action.severity];
}

export function compareActions(a: ShiftAction, b: ShiftAction): number {
  const bySeverity = actionSeverityRank(a) - actionSeverityRank(b);
  if (bySeverity !== 0) return bySeverity;
  return a.proximity - b.proximity;
}

export function priorityActions(source: ShiftAction[], limit = 5): ShiftAction[] {
  return [...source].sort(compareActions).slice(0, limit);
}

export function guestsNeedingAttention(sourceGuests: Guest[], sourceActions: ShiftAction[]): Guest[] {
  const ids = new Set(sourceActions.map((action) => action.guestId));
  return sourceGuests.filter((guest) => ids.has(guest.id));
}

export function guestById(id: string): Guest {
  const guest = guests.find((item) => item.id === id);
  if (!guest) throw new Error(`Unknown guest ${id}`);
  return guest;
}

export function isPending(action: ShiftAction): boolean {
  return action.status === "pending";
}

export function actionsForListing(listing: ListingId, source: ShiftAction[] = actions): ShiftAction[] {
  return source.filter((action) => action.listing === listing).sort(compareActions);
}

export function guestsForListing(listing: ListingId, source: ShiftAction[] = actions): Guest[] {
  const definition = listings[listing];
  if (definition.moment) {
    return guests.filter((guest) => guest.moment === definition.moment);
  }
  const seen = new Set<string>();
  const ordered: Guest[] = [];
  for (const action of actionsForListing(listing, source)) {
    if (seen.has(action.guestId)) continue;
    seen.add(action.guestId);
    ordered.push(guestById(action.guestId));
  }
  return ordered;
}

export function countForListing(listing: ListingId, source: ShiftAction[] = actions): number {
  if (listing === "recovery") return actionsForListing(listing, source).filter(isPending).length;
  return guestsForListing(listing, source).length;
}

export function momentCategoryCounts(listing: ListingId, source: ShiftAction[] = actions): {
  upselling: number;
  loyalty: number;
  guestExperience: number;
} {
  const relevant = actionsForListing(listing, source).filter(isPending);
  return {
    upselling: relevant.filter((action) => action.category === "upselling").length,
    loyalty: relevant.filter((action) => action.category === "loyalty").length,
    guestExperience: relevant.filter((action) => action.category === "guest-experience").length,
  };
}

export const money = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export const shiftDateLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(shiftDay);
