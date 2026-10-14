import { money } from "./shift";

export type InsightsPeriod = "today" | "7d" | "30d" | "custom";

export type InsightsCustomRange = {
  from: string;
  to: string;
};

export type InsightsKpi = {
  id: string;
  label: string;
  value: string;
  delta: string;
  positive: boolean;
};

export type InsightsSeriesPoint = {
  label: string;
  current: number;
  previous: number;
};

export type InsightsCategoryRow = {
  name: string;
  revenue: number;
};

export type InsightsAutomationRow = {
  automation: string;
  opportunities: number;
  conversion: number;
  revenue: number;
};

export type GuestInsightTab = "country" | "age" | "traveller" | "guest-type";

export type InsightsGuestSegmentRow = {
  segment: string;
  revenue: number;
  conversion: number;
  topService: string;
};

export type InsightsTeamRow = {
  receptionist: string;
  opportunities: number;
  sales: number;
  conversion: number;
  revenue: number;
  avgSale: number;
};

export type InsightsSnapshot = {
  kpis: InsightsKpi[];
  revenueSeries: InsightsSeriesPoint[];
  categories: InsightsCategoryRow[];
  automations: InsightsAutomationRow[];
  guestTabs: Record<GuestInsightTab, InsightsGuestSegmentRow[]>;
  guestNotes: Record<GuestInsightTab, string>;
  team: InsightsTeamRow[];
};

const euroDecimal = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatEuroDecimal(value: number): string {
  return euroDecimal.format(value);
}

const baseKpis30: InsightsKpi[] = [
  { id: "revenue", label: "Revenue generated", value: money.format(12480), delta: "+12% vs previous period", positive: true },
  { id: "conversion", label: "Conversion rate", value: "34.2%", delta: "+3.4% vs previous period", positive: true },
  { id: "sales", label: "Sales", value: "146", delta: "+18 vs previous period", positive: true },
  { id: "rev-stay", label: "Revenue / stay", value: formatEuroDecimal(18.4), delta: "+6% vs previous period", positive: true },
];

const series30: InsightsSeriesPoint[] = [
  { label: "1", current: 280, previous: 240 },
  { label: "5", current: 320, previous: 260 },
  { label: "9", current: 390, previous: 310 },
  { label: "13", current: 410, previous: 340 },
  { label: "17", current: 480, previous: 360 },
  { label: "21", current: 520, previous: 400 },
  { label: "25", current: 560, previous: 430 },
  { label: "30", current: 610, previous: 450 },
];

const categories30: InsightsCategoryRow[] = [
  { name: "Spa", revenue: 4250 },
  { name: "Room upgrades", revenue: 3180 },
  { name: "Late check-out", revenue: 2100 },
  { name: "F&B", revenue: 1420 },
  { name: "Transfers", revenue: 890 },
];

const automations30: InsightsAutomationRow[] = [
  { automation: "Previous spa guest → Spa", opportunities: 86, conversion: 42, revenue: 3240 },
  { automation: "Late departure → Late check-out", opportunities: 64, conversion: 38, revenue: 1920 },
  { automation: "Returning guest → Room upgrade", opportunities: 51, conversion: 31, revenue: 2480 },
  { automation: "Breakfast not included → Breakfast", opportunities: 47, conversion: 35, revenue: 940 },
];

const guestTabs30: Record<GuestInsightTab, InsightsGuestSegmentRow[]> = {
  country: [
    { segment: "Spain", revenue: 3820, conversion: 38, topService: "Spa" },
    { segment: "United Kingdom", revenue: 2940, conversion: 33, topService: "Room upgrades" },
    { segment: "France", revenue: 2180, conversion: 31, topService: "Late check-out" },
    { segment: "Germany", revenue: 1860, conversion: 29, topService: "F&B" },
    { segment: "United States", revenue: 1680, conversion: 27, topService: "Transfers" },
  ],
  age: [
    { segment: "18–29", revenue: 1640, conversion: 26, topService: "F&B" },
    { segment: "30–39", revenue: 3480, conversion: 36, topService: "Spa" },
    { segment: "40–49", revenue: 3920, conversion: 39, topService: "Room upgrades" },
    { segment: "50–59", revenue: 2460, conversion: 34, topService: "Late check-out" },
    { segment: "60+", revenue: 980, conversion: 22, topService: "Transfers" },
  ],
  traveller: [
    { segment: "Couples", revenue: 4820, conversion: 41, topService: "Spa" },
    { segment: "Families", revenue: 3640, conversion: 32, topService: "Experiences" },
    { segment: "Friends", revenue: 2140, conversion: 29, topService: "F&B" },
    { segment: "Solo travellers", revenue: 1880, conversion: 24, topService: "Late check-out" },
  ],
  "guest-type": [
    { segment: "First-time", revenue: 4120, conversion: 28, topService: "Late check-out" },
    { segment: "Returning", revenue: 5280, conversion: 37, topService: "Spa" },
    { segment: "Loyalty member", revenue: 3080, conversion: 44, topService: "Room upgrades" },
  ],
};

const guestNotes30: Record<GuestInsightTab, string> = {
  country: "Guests from Spain lead revenue, with Spa as their top-selling service.",
  age: "Guests aged 40–49 convert best, driven by Room upgrades.",
  traveller: "Couples show the highest conversion rate, with Spa as their top-selling service.",
  "guest-type": "Loyalty members convert at the highest rate, led by Room upgrades.",
};

const team30: InsightsTeamRow[] = [
  { receptionist: "Laura Martín", opportunities: 82, sales: 31, conversion: 38, revenue: 2480, avgSale: 80 },
  { receptionist: "Daniel Ruiz", opportunities: 87, sales: 28, conversion: 32, revenue: 1920, avgSale: 69 },
  { receptionist: "Marta López", opportunities: 46, sales: 19, conversion: 41, revenue: 1760, avgSale: 93 },
  { receptionist: "Carlos Vega", opportunities: 71, sales: 22, conversion: 31, revenue: 1540, avgSale: 70 },
];

function scaleFactor(period: InsightsPeriod): number {
  if (period === "today") return 0.08;
  if (period === "7d") return 0.28;
  if (period === "custom") return 0.55;
  return 1;
}

function scaleMoney(value: number, factor: number): number {
  return Math.round(value * factor);
}

function scaleKpis(factor: number): InsightsKpi[] {
  if (factor >= 0.99) return baseKpis30;
  if (factor < 0.15) {
    return [
      { id: "revenue", label: "Revenue generated", value: money.format(420), delta: "+4% vs previous period", positive: true },
      { id: "conversion", label: "Conversion rate", value: "31.0%", delta: "+1.1% vs previous period", positive: true },
      { id: "sales", label: "Sales", value: "9", delta: "+2 vs previous period", positive: true },
      { id: "rev-stay", label: "Revenue / stay", value: formatEuroDecimal(16.2), delta: "+2% vs previous period", positive: true },
    ];
  }
  if (factor < 0.4) {
    return [
      { id: "revenue", label: "Revenue generated", value: money.format(3480), delta: "+8% vs previous period", positive: true },
      { id: "conversion", label: "Conversion rate", value: "32.6%", delta: "+2.1% vs previous period", positive: true },
      { id: "sales", label: "Sales", value: "41", delta: "+6 vs previous period", positive: true },
      { id: "rev-stay", label: "Revenue / stay", value: formatEuroDecimal(17.1), delta: "+3% vs previous period", positive: true },
    ];
  }
  return [
    { id: "revenue", label: "Revenue generated", value: money.format(6860), delta: "+5% vs previous period", positive: true },
    { id: "conversion", label: "Conversion rate", value: "33.4%", delta: "-0.8% vs previous period", positive: false },
    { id: "sales", label: "Sales", value: "80", delta: "+9 vs previous period", positive: true },
    { id: "rev-stay", label: "Revenue / stay", value: formatEuroDecimal(17.8), delta: "+4% vs previous period", positive: true },
  ];
}

function scaleSeries(factor: number): InsightsSeriesPoint[] {
  if (factor >= 0.99) return series30;
  if (factor < 0.15) {
    return [
      { label: "6", current: 40, previous: 32 },
      { label: "9", current: 55, previous: 48 },
      { label: "12", current: 48, previous: 44 },
      { label: "15", current: 62, previous: 50 },
      { label: "18", current: 70, previous: 58 },
      { label: "21", current: 66, previous: 60 },
    ];
  }
  if (factor < 0.4) {
    return [
      { label: "Mon", current: 380, previous: 320 },
      { label: "Tue", current: 420, previous: 360 },
      { label: "Wed", current: 460, previous: 390 },
      { label: "Thu", current: 510, previous: 420 },
      { label: "Fri", current: 580, previous: 450 },
      { label: "Sat", current: 640, previous: 500 },
      { label: "Sun", current: 490, previous: 430 },
    ];
  }
  return series30.map((point) => ({
    label: point.label,
    current: Math.round(point.current * factor),
    previous: Math.round(point.previous * factor),
  }));
}

function scaleRows<T extends { revenue: number }>(rows: T[], factor: number): T[] {
  return rows.map((row) => ({ ...row, revenue: scaleMoney(row.revenue, factor) }));
}

function scaleAutomations(factor: number): InsightsAutomationRow[] {
  return automations30.map((row) => ({
    ...row,
    opportunities: Math.max(1, Math.round(row.opportunities * factor)),
    revenue: scaleMoney(row.revenue, factor),
  }));
}

function scaleGuestTabs(factor: number): Record<GuestInsightTab, InsightsGuestSegmentRow[]> {
  return {
    country: scaleRows(guestTabs30.country, factor),
    age: scaleRows(guestTabs30.age, factor),
    traveller: scaleRows(guestTabs30.traveller, factor),
    "guest-type": scaleRows(guestTabs30["guest-type"], factor),
  };
}

function scaleTeam(factor: number): InsightsTeamRow[] {
  return team30.map((row) => ({
    ...row,
    opportunities: Math.max(1, Math.round(row.opportunities * factor)),
    sales: Math.max(1, Math.round(row.sales * factor)),
    revenue: scaleMoney(row.revenue, factor),
    avgSale: Math.max(1, Math.round(row.avgSale * Math.max(factor, 0.85))),
  }));
}

export const guestInsightTabLabels: Record<GuestInsightTab, string> = {
  country: "Country",
  age: "Age",
  traveller: "Traveller type",
  "guest-type": "Guest type",
};

export const insightsPeriodOptions: { id: InsightsPeriod; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "custom", label: "Custom" },
];

export function getInsightsData(
  period: InsightsPeriod,
  _customRange?: InsightsCustomRange | null,
): InsightsSnapshot {
  const factor = scaleFactor(period);
  return {
    kpis: scaleKpis(factor),
    revenueSeries: scaleSeries(factor),
    categories: scaleRows(categories30, factor),
    automations: scaleAutomations(factor),
    guestTabs: scaleGuestTabs(factor),
    guestNotes: guestNotes30,
    team: scaleTeam(factor),
  };
}

export function formatInsightsPercent(value: number): string {
  return `${value}%`;
}
