import { countryFromOrigin, regionFromOrigin, type WorldSubregionId } from "./regions";

export type ListingId = "check-ins" | "check-outs" | "in-house" | "recovery";

export type Category = "upselling" | "loyalty" | "guest-experience" | "recovery";

export type Severity = "urgent" | "normal" | "low";

export type StayMoment = "check-in" | "check-out" | "in-house";

export type ActionStatus = "pending" | "notified" | "done" | "rejected" | "solved" | "confirmed";

export interface Companion {
  name: string;
  /** Si existe, el acompañante tiene ficha propia. */
  guestId?: string;
}

export type TravelCompanionship = "couple" | "friends" | "family" | "alone";

export const travelCompanionshipLabels: Record<TravelCompanionship, string> = {
  couple: "Travels as a couple",
  friends: "Travels with friends",
  family: "Travels with family",
  alone: "Travels alone",
};

export type BookingSource = "direct" | "ota";

export const bookingSourceLabels: Record<BookingSource, string> = {
  direct: "Direct booking",
  ota: "OTA booking",
};

export type BoardType = "all-inclusive" | "half-board" | "breakfast-only";

export const boardTypeLabels: Record<BoardType, string> = {
  "all-inclusive": "All inclusive",
  "half-board": "Half board",
  "breakfast-only": "Breakfast only",
};

const boardTypeCycle: BoardType[] = ["breakfast-only", "half-board", "all-inclusive"];

export interface PastStay {
  roomType: string;
  from: string;
  to: string;
  bookingSource: BookingSource;
  boardType: BoardType;
}

type StaySeed = Omit<PastStay, "bookingSource" | "boardType"> & {
  bookingSource?: BookingSource;
  boardType?: BoardType;
};

function withStayDefaults(stay: StaySeed, index: number): PastStay {
  return {
    ...stay,
    bookingSource: stay.bookingSource ?? (index % 2 === 0 ? "direct" : "ota"),
    boardType: stay.boardType ?? boardTypeCycle[index % boardTypeCycle.length],
  };
}

export interface GuestNote {
  text: string;
  author: string;
  date: string;
}

const receptionNoteSeeds = [
  "Prefers a quiet room away from the lift.",
  "Asked for extra towels at check-in.",
  "Likes a newspaper left outside in the morning.",
  "Travels light; no need for a luggage trolley.",
  "Requested a late wake-up call.",
  "Enjoys the garden terrace in the afternoon.",
  "Prefers contact by WhatsApp for room requests.",
  "Allergic to feather pillows — foam provided.",
];

export function ensureReceptionNotes(
  guest: { id: string; arrival: string; notes?: GuestNote[] },
): GuestNote[] {
  const notes = guest.notes ?? [];
  if (notes.some((note) => note.author === "Reception")) return notes;

  const index = guest.id.charCodeAt(0) % receptionNoteSeeds.length;
  return [
    ...notes,
    {
      text: receptionNoteSeeds[index],
      author: "Reception",
      date: guest.arrival,
    },
  ];
}

export type OpportunityOutcome = "done" | "rejected";

export type OpportunityCategory = Exclude<Category, "recovery">;

export interface PastRecord {
  id: string;
  kind: "incident" | "opportunity";
  label: string;
  when: string;
  /** Opportunity type (upselling, loyalty, special amenities). */
  category?: OpportunityCategory;
  /** Whether the opportunity was carried out. */
  outcome?: OpportunityOutcome;
}

const opportunityCategoryCycle: OpportunityCategory[] = [
  "upselling",
  "loyalty",
  "guest-experience",
];

const opportunitySeedLabels: Record<OpportunityCategory, string[]> = {
  upselling: ["Room upgrade", "Spa treatment", "Late check-out", "Restaurant reservation"],
  loyalty: ["Loyalty enrolment", "Loyalty renewal", "Points top-up"],
  "guest-experience": ["Birthday amenity", "Welcome amenity", "Anniversary amenity"],
};

export function ensurePastOpportunities(
  guestId: string,
  past: PastRecord[],
): PastRecord[] {
  const normalized = past.map((record) => {
    if (record.kind !== "opportunity") return record;
    const index = record.id.charCodeAt(0);
    return {
      ...record,
      category: record.category ?? opportunityCategoryCycle[index % opportunityCategoryCycle.length],
      outcome: record.outcome ?? (index % 2 === 0 ? "done" : "rejected"),
    };
  });

  if (normalized.some((record) => record.kind === "opportunity")) return normalized;

  const index = guestId.charCodeAt(0);
  const category = opportunityCategoryCycle[index % opportunityCategoryCycle.length];
  const labels = opportunitySeedLabels[category];
  return [
    ...normalized,
    {
      id: `${guestId}-past-opportunity`,
      kind: "opportunity",
      label: labels[index % labels.length],
      when: index % 2 === 0 ? "Mar 2026" : "Nov 2025",
      category,
      outcome: index % 2 === 0 ? "done" : "rejected",
    },
  ];
}

export interface GuestPreferences {
  roomType: string;
  bedType: string;
  pillowType: string;
  dining: string;
}

const bedTypeCycle = ["King", "Twin", "Queen"] as const;
const pillowTypeCycle = ["Soft", "Firm", "Hypoallergenic"] as const;
const diningCycle = ["Vegetarian", "No shellfish", "Gluten-free", "Dairy-free"] as const;

export function defaultPreferences(guest: {
  id: string;
  stays: PastStay[];
  preferences?: Partial<GuestPreferences>;
}): GuestPreferences {
  const index = guest.id.charCodeAt(0);
  return {
    roomType: guest.stays[0]?.roomType ?? "Superior double",
    bedType: bedTypeCycle[index % bedTypeCycle.length],
    pillowType: pillowTypeCycle[index % pillowTypeCycle.length],
    dining: diningCycle[index % diningCycle.length],
    ...guest.preferences,
  };
}

export interface GuestSpend {
  /** Room / stay charges. */
  stay: number;
  /** Ancillary spend (spa, F&B extras, etc.). */
  extras: number;
}

export const spendCategoryLabels: Record<keyof GuestSpend, string> = {
  stay: "Stay",
  extras: "Extras",
};

export function defaultSpend(guest: {
  id: string;
  stays: PastStay[];
  spend?: Partial<GuestSpend>;
}): GuestSpend {
  const index = guest.id.charCodeAt(0);
  const stayNights = Math.max(1, guest.stays.length * 2 + (index % 3));
  const stay = guest.spend?.stay ?? 160 * stayNights + (index % 5) * 40;
  const extras = guest.spend?.extras ?? Math.round(stay * (0.18 + (index % 4) * 0.04));
  return { stay, extras };
}

export function formatSpend(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export interface Guest {
  id: string;
  name: string;
  room: string;
  moment: StayMoment;
  /** Estancias anteriores a la actual. 0 significa primera visita. */
  previousStays: number;
  vip: boolean;
  /** Inscrito en el programa de loyalty. */
  loyaltyMember: boolean;
  arrival: string;
  departure: string;
  partySize: number;
  origin: string;
  /** Country where the guest lives. */
  country: string;
  /** World subregion where the guest lives. */
  region: WorldSubregionId;
  birthDate: string;
  profession: string;
  hobbies: string;
  companions: Companion[];
  /** How the guest is travelling on this stay. */
  companionship: TravelCompanionship;
  preferences: GuestPreferences;
  /** Lifetime spend breakdown across stays. */
  spend: GuestSpend;
  stays: PastStay[];
  notes: GuestNote[];
  past: PastRecord[];
}

export function companionshipFromParty(partySize: number, companions: Companion[]): TravelCompanionship {
  if (partySize <= 1 && companions.length === 0) return "alone";
  if (partySize === 2 || companions.length === 1) return "couple";
  if (partySize >= 4 || companions.length >= 3) return "family";
  return "friends";
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
  /** Importe estimado en euros. Solo upselling. */
  value?: number;
  status: ActionStatus;
  /** Recovery: detalle largo de la incidencia. */
  description?: string;
  createdAt?: string;
  notifiedAt?: string;
  solvedAt?: string;
  confirmedAt?: string;
  history?: IncidentHistoryEntry[];
}

export interface IncidentHistoryEntry {
  status: ActionStatus;
  at: string;
  note: string;
}

export interface Listing {
  id: ListingId;
  path: string;
  title: string;
  unit: string;
  moment?: StayMoment;
}

export const shiftDay = new Date(2026, 8, 30);

export function shiftDateTime(hour: number, minute: number): string {
  return new Date(2026, 8, 30, hour, minute, 0).toISOString();
}

export function formatIncidentWhen(value?: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function incidentHistoryNote(status: ActionStatus): string {
  if (status === "notified") return "Department notified";
  if (status === "solved") return "Marked as solved";
  if (status === "confirmed") return "Confirmed with guest";
  return "Incident opened";
}

export const last7Days = {
  upsellingRevenue: { value: 840, direction: "up" },
  loyaltySignUps: { value: 6, direction: "down" },
  guestsPampered: { value: 11, direction: "up" },
} as const;

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
  "guest-experience": "Special amenities",
  recovery: "Recovery",
};

export const guests: Guest[] = (
  [
  {
    id: "laura",
    name: "Laura Martín",
    room: "302",
    moment: "check-in",
    previousStays: 4,
    vip: true,
    loyaltyMember: false,
    arrival: "30 Sep 2026",
    departure: "4 Oct 2026",
    partySize: 3,
    origin: "Madrid",
    birthDate: "14 March 1984",
    profession: "Architect",
    hobbies: "Contemporary art, cycling",
    companionship: "family",
    companions: [
      { name: "Marta Lind", guestId: "marta" },
      { name: "Anna Martín" },
    ],
    preferences: {
      roomType: "Deluxe king",
      bedType: "King",
      pillowType: "Soft",
      dining: "Oat milk / dairy-free breakfast",
    },
    spend: { stay: 2840, extras: 620 },
    stays: [
      { roomType: "Deluxe king", from: "30 Sep 2026", to: "4 Oct 2026", bookingSource: "direct", boardType: "half-board" },
      { roomType: "Junior suite", from: "2 May 2026", to: "6 May 2026", bookingSource: "direct", boardType: "breakfast-only" },
      { roomType: "Deluxe king", from: "18 Nov 2025", to: "21 Nov 2025", bookingSource: "ota", boardType: "all-inclusive" },
      { roomType: "Garden room", from: "9 Aug 2025", to: "14 Aug 2025", bookingSource: "direct", boardType: "half-board" },
      { roomType: "Deluxe king", from: "3 Feb 2025", to: "7 Feb 2025", bookingSource: "ota", boardType: "breakfast-only" },
    ],
    notes: [
      { text: "Prefers a high floor and a quiet room.", author: "Reception", date: "2 May 2026" },
      { text: "Asked for oat milk at breakfast last stay.", author: "Reception", date: "18 Nov 2025" },
    ],
    past: [
      {
        id: "laura-past-spa",
        kind: "opportunity",
        label: "Spa afternoon",
        when: "May 2026",
        category: "upselling",
        outcome: "done",
      },
      { id: "laura-past-pillow", kind: "incident", label: "Extra pillows", when: "Nov 2025" },
      {
        id: "laura-past-late",
        kind: "opportunity",
        label: "Late check-out",
        when: "Aug 2025",
        category: "upselling",
        outcome: "rejected",
      },
    ],
  },
  {
    id: "james",
    name: "James Okonkwo",
    room: "214",
    moment: "check-in",
    previousStays: 0,
    vip: false,
    loyaltyMember: false,
    arrival: "30 Sep 2026",
    departure: "2 Oct 2026",
    partySize: 1,
    origin: "Lagos",
    birthDate: "3 June 1991",
    profession: "Product manager",
    hobbies: "Photography",
    companions: [],
    stays: [{ roomType: "Superior double", from: "30 Sep 2026", to: "2 Oct 2026", bookingSource: "ota", boardType: "breakfast-only" }],
    notes: [{ text: "Prefers a late breakfast and a quiet table.", author: "Reception", date: "29 Sep 2026" }],
    past: [],
  },
  {
    id: "paul",
    name: "Paul Adeyemi",
    room: "108",
    moment: "check-in",
    previousStays: 0,
    vip: false,
    loyaltyMember: false,
    arrival: "30 Sep 2026",
    departure: "5 Oct 2026",
    partySize: 2,
    origin: "London",
    birthDate: "22 January 1988",
    profession: "Journalist",
    hobbies: "Jazz, long walks",
    companions: [{ name: "David Adeyemi" }],
    stays: [{ roomType: "Superior twin", from: "30 Sep 2026", to: "5 Oct 2026", bookingSource: "direct", boardType: "half-board" }],
    notes: [
      {
        text: "Travelling with his brother; twin beds confirmed.",
        author: "Reception",
        date: "30 Sep 2026",
      },
    ],
    past: [],
  },
  {
    id: "elena",
    name: "Elena Varga",
    room: "221",
    moment: "check-out",
    previousStays: 3,
    vip: false,
    loyaltyMember: true,
    arrival: "26 Sep 2026",
    departure: "30 Sep 2026",
    partySize: 2,
    origin: "Budapest",
    birthDate: "9 September 1979",
    profession: "Gallery owner",
    hobbies: "Wine, design fairs",
    companions: [{ name: "Andras Varga" }],
    stays: [
      { roomType: "Deluxe king", from: "26 Sep 2026", to: "30 Sep 2026", bookingSource: "direct", boardType: "all-inclusive" },
      { roomType: "Deluxe king", from: "11 Apr 2026", to: "14 Apr 2026", bookingSource: "ota", boardType: "breakfast-only" },
      { roomType: "Junior suite", from: "20 Oct 2025", to: "24 Oct 2025", bookingSource: "direct", boardType: "half-board" },
      { roomType: "Garden room", from: "2 Jun 2025", to: "6 Jun 2025", bookingSource: "ota", boardType: "all-inclusive" },
    ],
    notes: [{ text: "Does not use the minibar.", author: "Reception", date: "11 Apr 2026" }],
    past: [
      { id: "elena-past-noise", kind: "incident", label: "Noise from the corridor", when: "Apr 2026" },
      {
        id: "elena-past-upgrade",
        kind: "opportunity",
        label: "Suite upgrade",
        when: "Oct 2025",
        category: "upselling",
        outcome: "done",
      },
    ],
  },
  {
    id: "amira",
    name: "Amira Hassan",
    room: "118",
    moment: "check-out",
    previousStays: 0,
    vip: false,
    loyaltyMember: false,
    arrival: "27 Sep 2026",
    departure: "30 Sep 2026",
    partySize: 1,
    origin: "Cairo",
    birthDate: "17 December 1994",
    profession: "Physician",
    hobbies: "Swimming",
    companions: [],
    stays: [{ roomType: "Superior double", from: "27 Sep 2026", to: "30 Sep 2026", bookingSource: "ota", boardType: "half-board" }],
    notes: [{ text: "Likes the pool first thing in the morning.", author: "Reception", date: "28 Sep 2026" }],
    past: [],
  },
  {
    id: "sofia",
    name: "Sofia Ricci",
    room: "305",
    moment: "in-house",
    previousStays: 2,
    vip: true,
    loyaltyMember: true,
    arrival: "28 Sep 2026",
    departure: "3 Oct 2026",
    partySize: 2,
    origin: "Milan",
    birthDate: "5 May 1986",
    profession: "Fashion editor",
    hobbies: "Tennis, cooking",
    companions: [{ name: "Luca Ricci" }],
    stays: [
      { roomType: "Junior suite", from: "28 Sep 2026", to: "3 Oct 2026", bookingSource: "direct", boardType: "breakfast-only" },
      { roomType: "Junior suite", from: "14 Jan 2026", to: "18 Jan 2026", bookingSource: "direct", boardType: "half-board" },
      { roomType: "Deluxe king", from: "7 Sep 2025", to: "11 Sep 2025", bookingSource: "ota", boardType: "all-inclusive" },
    ],
    notes: [
      { text: "Greets the team by name.", author: "Reception", date: "28 Sep 2026" },
      { text: "Likes fashion magazines left on the desk.", author: "Reception", date: "14 Jan 2026" },
    ],
    past: [
      { id: "sofia-past-ac", kind: "incident", label: "Air conditioning too warm", when: "Jan 2026" },
      {
        id: "sofia-past-dinner",
        kind: "opportunity",
        label: "Restaurant reservation",
        when: "Sep 2025",
        category: "upselling",
        outcome: "done",
      },
    ],
  },
  {
    id: "tom",
    name: "Tom Becker",
    room: "510",
    moment: "in-house",
    previousStays: 0,
    vip: false,
    loyaltyMember: false,
    arrival: "29 Sep 2026",
    departure: "2 Oct 2026",
    partySize: 1,
    origin: "Hamburg",
    birthDate: "30 July 1990",
    profession: "Engineer",
    hobbies: "Running",
    companions: [],
    stays: [{ roomType: "Superior double", from: "29 Sep 2026", to: "2 Oct 2026", bookingSource: "direct", boardType: "breakfast-only" }],
    notes: [
      {
        text: "Goes for a run before breakfast; early corridor access noted.",
        author: "Reception",
        date: "29 Sep 2026",
      },
    ],
    past: [],
  },
  {
    id: "kenji",
    name: "Kenji Sato",
    room: "418",
    moment: "in-house",
    previousStays: 6,
    vip: true,
    loyaltyMember: true,
    arrival: "27 Sep 2026",
    departure: "4 Oct 2026",
    partySize: 2,
    origin: "Kyoto",
    birthDate: "1 October 1976",
    profession: "University professor",
    hobbies: "Calligraphy, tea",
    companions: [{ name: "Yuki Sato" }],
    stays: [
      { roomType: "Deluxe king", from: "27 Sep 2026", to: "4 Oct 2026", bookingSource: "direct", boardType: "half-board" },
      { roomType: "Deluxe king", from: "4 Mar 2026", to: "10 Mar 2026", bookingSource: "direct", boardType: "breakfast-only" },
      { roomType: "Junior suite", from: "16 Nov 2025", to: "20 Nov 2025", bookingSource: "ota", boardType: "all-inclusive" },
      { roomType: "Deluxe king", from: "8 Jul 2025", to: "13 Jul 2025", bookingSource: "direct", boardType: "half-board" },
      { roomType: "Garden room", from: "22 Feb 2025", to: "26 Feb 2025", bookingSource: "ota", boardType: "breakfast-only" },
      { roomType: "Deluxe king", from: "3 Oct 2024", to: "8 Oct 2024", bookingSource: "direct", boardType: "all-inclusive" },
    ],
    notes: [
      { text: "Takes tea in the room after dinner.", author: "Reception", date: "27 Sep 2026" },
      { text: "Always books a high floor.", author: "Reception", date: "4 Mar 2026" },
    ],
    past: [
      { id: "kenji-past-water", kind: "incident", label: "Hot water slow to arrive", when: "Mar 2026" },
      {
        id: "kenji-past-loyalty",
        kind: "opportunity",
        label: "Loyalty renewal",
        when: "Nov 2025",
        category: "loyalty",
        outcome: "done",
      },
      { id: "kenji-past-pillow", kind: "incident", label: "Firm pillow request", when: "Jul 2025" },
      {
        id: "kenji-past-spa",
        kind: "opportunity",
        label: "Spa for two",
        when: "Feb 2025",
        category: "upselling",
        outcome: "rejected",
      },
      {
        id: "kenji-past-cake",
        kind: "opportunity",
        label: "Birthday cake",
        when: "Oct 2024",
        category: "guest-experience",
        outcome: "done",
      },
    ],
  },
  {
    id: "nina",
    name: "Nina Kowalski",
    room: "330",
    moment: "in-house",
    previousStays: 1,
    vip: false,
    loyaltyMember: true,
    arrival: "28 Sep 2026",
    departure: "1 Oct 2026",
    partySize: 2,
    origin: "Krakow",
    birthDate: "19 February 1992",
    profession: "Translator",
    hobbies: "Cinema",
    companions: [{ name: "Piotr Kowalski" }],
    stays: [
      { roomType: "Superior double", from: "28 Sep 2026", to: "1 Oct 2026", bookingSource: "ota", boardType: "half-board" },
      { roomType: "Superior double", from: "12 Dec 2025", to: "15 Dec 2025", bookingSource: "direct", boardType: "breakfast-only" },
    ],
    notes: [{ text: "Reads in the lounge in the evening.", author: "Reception", date: "28 Sep 2026" }],
    past: [{ id: "nina-past-safe", kind: "incident", label: "Room safe would not open", when: "Dec 2025" }],
  },
  {
    id: "marta",
    name: "Marta Lind",
    room: "255",
    moment: "in-house",
    previousStays: 1,
    vip: false,
    loyaltyMember: false,
    arrival: "29 Sep 2026",
    departure: "4 Oct 2026",
    partySize: 1,
    origin: "Stockholm",
    birthDate: "11 August 1987",
    profession: "Interior designer",
    hobbies: "Ceramics, sailing",
    companions: [{ name: "Laura Martín", guestId: "laura" }],
    stays: [
      { roomType: "Deluxe king", from: "29 Sep 2026", to: "4 Oct 2026", bookingSource: "direct", boardType: "all-inclusive" },
      { roomType: "Garden room", from: "9 Aug 2025", to: "14 Aug 2025", bookingSource: "ota", boardType: "half-board" },
    ],
    notes: [{ text: "Travelling with Laura Martín. Separate room.", author: "Reception", date: "29 Sep 2026" }],
    past: [
      {
        id: "marta-past-room",
        kind: "opportunity",
        label: "Adjoining rooms",
        when: "Aug 2025",
        category: "guest-experience",
        outcome: "done",
      },
    ],
  },
  ] as Array<
    Omit<Guest, "region" | "country" | "companionship" | "stays" | "preferences" | "spend"> & {
      region?: WorldSubregionId;
      country?: string;
      companionship?: TravelCompanionship;
      preferences?: Partial<GuestPreferences>;
      spend?: Partial<GuestSpend>;
      stays: StaySeed[];
    }
  >
).map((guest) => {
  const stays = guest.stays.map(withStayDefaults);
  return {
    ...guest,
    country: guest.country ?? countryFromOrigin(guest.origin),
    region: guest.region ?? regionFromOrigin(guest.origin),
    companionship:
      guest.companionship ?? companionshipFromParty(guest.partySize, guest.companions),
    stays,
    preferences: defaultPreferences({ id: guest.id, stays, preferences: guest.preferences }),
    spend: defaultSpend({ id: guest.id, stays, spend: guest.spend }),
    past: ensurePastOpportunities(guest.id, guest.past ?? []),
    notes: ensureReceptionNotes(guest),
  };
});

function seedGuest(
  guest: Pick<Guest, "id" | "name" | "room" | "moment" | "arrival" | "departure" | "origin"> &
    Partial<
      Omit<
        Guest,
        "id" | "name" | "room" | "moment" | "arrival" | "departure" | "origin" | "stays" | "preferences" | "spend"
      >
    > & {
      stays?: StaySeed[];
      preferences?: Partial<GuestPreferences>;
      spend?: Partial<GuestSpend>;
    },
): Guest {
  const merged = {
    previousStays: 0,
    vip: false,
    loyaltyMember: false,
    partySize: 1,
    birthDate: "1 January 1990",
    profession: "Guest",
    hobbies: "Travel",
    companions: [],
    notes: [],
    past: [],
    stays: [{ roomType: "Superior double", from: guest.arrival, to: guest.departure }] as StaySeed[],
    ...guest,
  };
  const stays = merged.stays.map((stay, index) =>
    withStayDefaults(
      {
        ...stay,
        bookingSource:
          stay.bookingSource ??
          ((merged.id.charCodeAt(0) + index) % 2 === 0 ? "direct" : "ota"),
        boardType:
          stay.boardType ?? boardTypeCycle[(merged.id.charCodeAt(0) + index) % boardTypeCycle.length],
      },
      index,
    ),
  );
  return {
    ...merged,
    country: guest.country ?? countryFromOrigin(merged.origin),
    region: guest.region ?? regionFromOrigin(merged.origin),
    companionship:
      guest.companionship ?? companionshipFromParty(merged.partySize, merged.companions),
    stays,
    preferences: defaultPreferences({ id: merged.id, stays, preferences: guest.preferences }),
    spend: defaultSpend({ id: merged.id, stays, spend: guest.spend }),
    past: ensurePastOpportunities(merged.id, merged.past ?? []),
    notes: ensureReceptionNotes(merged),
  };
}

guests.push(
  seedGuest({
    id: "clara",
    name: "Clara Dubois",
    room: "401",
    moment: "check-in",
    arrival: "30 Sep 2026",
    departure: "3 Oct 2026",
    origin: "Lyon",
    previousStays: 1,
  }),
  seedGuest({
    id: "hugo",
    name: "Hugo Berg",
    room: "402",
    moment: "check-in",
    arrival: "30 Sep 2026",
    departure: "2 Oct 2026",
    origin: "Oslo",
    partySize: 3,
    companionship: "friends",
    companions: [{ name: "Lars Berg" }, { name: "Nora Vik" }],
  }),
  seedGuest({
    id: "ines",
    name: "Inés Navarro",
    room: "403",
    moment: "check-in",
    arrival: "30 Sep 2026",
    departure: "4 Oct 2026",
    origin: "Valencia",
    partySize: 2,
    companions: [{ name: "Marco Navarro" }],
  }),
  seedGuest({
    id: "omar",
    name: "Omar Farid",
    room: "404",
    moment: "check-in",
    arrival: "30 Sep 2026",
    departure: "1 Oct 2026",
    origin: "Dubai",
  }),
  seedGuest({
    id: "priya",
    name: "Priya Sharma",
    room: "405",
    moment: "check-in",
    arrival: "30 Sep 2026",
    departure: "5 Oct 2026",
    origin: "Mumbai",
    previousStays: 2,
    loyaltyMember: true,
  }),
  seedGuest({
    id: "lucas",
    name: "Lucas Meyer",
    room: "406",
    moment: "check-in",
    arrival: "30 Sep 2026",
    departure: "3 Oct 2026",
    origin: "Zurich",
  }),
  seedGuest({
    id: "aisha",
    name: "Aisha Benali",
    room: "407",
    moment: "check-in",
    arrival: "30 Sep 2026",
    departure: "2 Oct 2026",
    origin: "Casablanca",
  }),
  seedGuest({
    id: "erik",
    name: "Erik Johansson",
    room: "408",
    moment: "check-in",
    arrival: "30 Sep 2026",
    departure: "4 Oct 2026",
    origin: "Gothenburg",
    partySize: 2,
    companions: [{ name: "Eva Johansson" }],
  }),
  seedGuest({
    id: "mei",
    name: "Mei Chen",
    room: "409",
    moment: "check-in",
    arrival: "30 Sep 2026",
    departure: "3 Oct 2026",
    origin: "Singapore",
    vip: true,
    previousStays: 3,
    loyaltyMember: true,
  }),
  seedGuest({
    id: "jonas",
    name: "Jonas Keller",
    room: "411",
    moment: "in-house",
    arrival: "28 Sep 2026",
    departure: "2 Oct 2026",
    origin: "Vienna",
  }),
  seedGuest({
    id: "rosa",
    name: "Rosa Almeida",
    room: "412",
    moment: "in-house",
    arrival: "27 Sep 2026",
    departure: "1 Oct 2026",
    origin: "Lisbon",
    previousStays: 1,
  }),
  seedGuest({
    id: "felix",
    name: "Felix Braun",
    room: "413",
    moment: "in-house",
    arrival: "29 Sep 2026",
    departure: "3 Oct 2026",
    origin: "Munich",
  }),
  seedGuest({
    id: "yara",
    name: "Yara Haddad",
    room: "414",
    moment: "in-house",
    arrival: "28 Sep 2026",
    departure: "4 Oct 2026",
    origin: "Beirut",
    partySize: 2,
    companions: [{ name: "Samir Haddad" }],
  }),
  seedGuest({
    id: "noah",
    name: "Noah Williams",
    room: "415",
    moment: "in-house",
    arrival: "29 Sep 2026",
    departure: "2 Oct 2026",
    origin: "Toronto",
  }),
  seedGuest({
    id: "giulia",
    name: "Giulia Conti",
    room: "416",
    moment: "in-house",
    arrival: "27 Sep 2026",
    departure: "3 Oct 2026",
    origin: "Rome",
    previousStays: 2,
    loyaltyMember: true,
  }),
  seedGuest({
    id: "samuel",
    name: "Samuel Okafor",
    room: "417",
    moment: "in-house",
    arrival: "28 Sep 2026",
    departure: "1 Oct 2026",
    origin: "Accra",
  }),
  seedGuest({
    id: "helena",
    name: "Helena Novak",
    room: "419",
    moment: "in-house",
    arrival: "29 Sep 2026",
    departure: "4 Oct 2026",
    origin: "Prague",
  }),
  seedGuest({
    id: "diego",
    name: "Diego Rojas",
    room: "420",
    moment: "in-house",
    arrival: "26 Sep 2026",
    departure: "2 Oct 2026",
    origin: "Santiago",
    previousStays: 1,
  }),
  seedGuest({
    id: "freya",
    name: "Freya Olsen",
    room: "421",
    moment: "in-house",
    arrival: "28 Sep 2026",
    departure: "3 Oct 2026",
    origin: "Copenhagen",
  }),
  seedGuest({
    id: "arthur",
    name: "Arthur Reed",
    room: "422",
    moment: "in-house",
    arrival: "29 Sep 2026",
    departure: "1 Oct 2026",
    origin: "Dublin",
  }),
  seedGuest({
    id: "camille",
    name: "Camille Roux",
    room: "119",
    moment: "check-out",
    arrival: "27 Sep 2026",
    departure: "30 Sep 2026",
    origin: "Paris",
    previousStays: 1,
  }),
  seedGuest({
    id: "ivan",
    name: "Ivan Petrov",
    room: "120",
    moment: "check-out",
    arrival: "26 Sep 2026",
    departure: "30 Sep 2026",
    origin: "Sofia",
  }),
  seedGuest({
    id: "leila",
    name: "Leila Mansour",
    room: "121",
    moment: "check-out",
    arrival: "28 Sep 2026",
    departure: "30 Sep 2026",
    origin: "Tunis",
    partySize: 2,
    companions: [{ name: "Karim Mansour" }],
  }),
  seedGuest({
    id: "harry",
    name: "Harry Collins",
    room: "122",
    moment: "check-out",
    arrival: "25 Sep 2026",
    departure: "30 Sep 2026",
    origin: "Manchester",
    previousStays: 2,
    loyaltyMember: true,
  }),
);

export function stayMomentLabel(moment: StayMoment): string {
  if (moment === "check-in") return "Check-in";
  if (moment === "check-out") return "Check-out";
  return "In-house";
}

export function listingForMoment(moment: StayMoment): ListingId {
  if (moment === "check-in") return "check-ins";
  if (moment === "check-out") return "check-outs";
  return "in-house";
}

export const upsellServices = [
  { id: "transfer", label: "Airport transfer", offer: "Offer airport transfer", value: 65 },
  { id: "spa", label: "Spa massage", offer: "Offer a spa massage", value: 80 },
  { id: "late", label: "Late check-out", offer: "Offer late check-out", value: 45 },
] as const;

export const experienceTypes = [
  { id: "birthday", label: "Birthday detail" },
  { id: "anniversary", label: "Anniversary detail" },
  { id: "vip", label: "VIP welcome gift" },
] as const;

export const housekeepingOptions = [
  { id: "notified", label: "Housekeeping notified" },
  { id: "not-notified", label: "Housekeeping not notified" },
] as const;

export function isVipOrReturning(guest: Guest): boolean {
  return guest.vip || guest.previousStays >= 1;
}

export function isLoyaltyMember(guest: Guest, source: ShiftAction[]): boolean {
  if (guest.loyaltyMember) return true;
  return source.some(
    (action) => action.guestId === guest.id && action.category === "loyalty" && action.status === "done",
  );
}

export type GuestStayFilter = "all" | "arriving" | "leaving" | "in-house";

export function peopleCount(moment?: StayMoment): number {
  if (!moment) return guests.length;
  return guests.filter((guest) => guest.moment === moment).length;
}

/** Reservations for the day (hotel-wide). More guests than bookings when parties share a reservation. */
export function reservationCount(moment: StayMoment): number {
  if (moment === "check-in") return 6;
  if (moment === "in-house") return 10;
  return 4;
}

/** People with a profile at that stay moment — same count as Guest Profiles filters. */
export function guestHeadcount(moment: StayMoment): number {
  return peopleCount(moment);
}

export function guestsForFilter(filter: GuestStayFilter, source: Guest[] = guests): Guest[] {
  const moment =
    filter === "arriving" ? "check-in" : filter === "leaving" ? "check-out" : filter === "in-house" ? "in-house" : null;
  const list = moment ? source.filter((guest) => guest.moment === moment) : source;
  return [...list].sort((a, b) => a.name.localeCompare(b.name));
}

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
    description: "Guest reported the room is too warm and the air conditioning does not cool properly.",
    listing: "recovery",
    severity: "urgent",
    proximity: 3,
    timingLabel: "Later today",
    createdAt: shiftDateTime(7, 12),
    history: [{ status: "pending", at: shiftDateTime(7, 12), note: "Incident opened" }],
  },
  {
    id: "amira-noise",
    guestId: "amira",
    category: "recovery",
    label: "Follow up on the noise complaint",
    description: "Guest asked reception to address noise from the corridor during the night.",
    listing: "recovery",
    severity: "normal",
    proximity: 0,
    timingLabel: "This morning",
    createdAt: shiftDateTime(6, 40),
    history: [{ status: "pending", at: shiftDateTime(6, 40), note: "Incident opened" }],
  },
  {
    id: "tom-minibar",
    guestId: "tom",
    category: "recovery",
    label: "Follow up on the minibar charge",
    description: "Guest disputes a minibar charge that appears on the folio.",
    listing: "recovery",
    severity: "low",
    proximity: 0,
    timingLabel: "This morning",
    createdAt: shiftDateTime(8, 5),
    history: [{ status: "pending", at: shiftDateTime(8, 5), note: "Incident opened" }],
  },
  {
    id: "kenji-water",
    guestId: "kenji",
    category: "recovery",
    label: "Follow up on the hot water",
    description: "Hot water takes a long time to arrive in the bathroom.",
    listing: "recovery",
    severity: "normal",
    proximity: 1,
    timingLabel: "Today",
    createdAt: shiftDateTime(9, 20),
    history: [{ status: "pending", at: shiftDateTime(9, 20), note: "Incident opened" }],
  },
  {
    id: "nina-safe",
    guestId: "nina",
    category: "recovery",
    label: "Follow up on the room safe",
    description: "The room safe would not open after the guest entered the code.",
    listing: "recovery",
    severity: "low",
    proximity: 2,
    timingLabel: "Today",
    createdAt: shiftDateTime(10, 15),
    history: [{ status: "pending", at: shiftDateTime(10, 15), note: "Incident opened" }],
  },
  {
    id: "laura-spa",
    guestId: "laura",
    category: "upselling",
    label: "Offer Spa treatment",
    description: "Mention the guest’s previous spa visit and offer a 50-minute treatment.",
    listing: "check-ins",
    proximity: 0,
    timingLabel: "Today",
    value: 80,
  },
  {
    id: "james-breakfast",
    guestId: "james",
    category: "upselling",
    label: "Offer Breakfast",
    description: "Offer breakfast for the stay when it is not included in the rate.",
    listing: "check-ins",
    proximity: 1,
    timingLabel: "This morning",
    value: 28,
  },
  {
    id: "laura-loyalty",
    guestId: "laura",
    category: "loyalty",
    label: "Invite to Loyalty program",
    description: "Explain member benefits briefly and offer to enrol at the desk.",
    listing: "check-ins",
    proximity: 2,
    timingLabel: "Today",
  },
  {
    id: "paul-birthday",
    guestId: "paul",
    category: "guest-experience",
    label: "Send Birthday amenity",
    description: "Arrange a complimentary amenity and a handwritten birthday note in the room.",
    listing: "check-ins",
    proximity: 3,
    timingLabel: "Today",
  },
  {
    id: "mei-returning",
    guestId: "mei",
    category: "guest-experience",
    label: "Send Returning Guest amenity",
    description: "Prepare a welcome back amenity before arrival for returning guests.",
    listing: "check-ins",
    proximity: 4,
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
    value: 45,
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
  if (listing === "recovery") {
    return actionsForListing(listing, source).filter(
      (action) => action.status === "pending" || action.status === "notified" || action.status === "solved",
    ).length;
  }
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

const shiftTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatShiftTime(now: Date = new Date()): string {
  return shiftTimeFormatter.format(now);
}
