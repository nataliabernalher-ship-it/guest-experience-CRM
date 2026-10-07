export type WorldContinentId = "africa" | "americas" | "asia" | "europe" | "oceania";

export type WorldSubregionId =
  | "northern-africa"
  | "western-africa"
  | "central-africa"
  | "eastern-africa"
  | "southern-africa"
  | "northern-america"
  | "central-america"
  | "caribbean"
  | "south-america"
  | "western-asia"
  | "central-asia"
  | "southern-asia"
  | "eastern-asia"
  | "south-eastern-asia"
  | "northern-europe"
  | "western-europe"
  | "eastern-europe"
  | "southern-europe"
  | "australia-new-zealand"
  | "melanesia"
  | "micronesia"
  | "polynesia";

export interface WorldSubregion {
  id: WorldSubregionId;
  continentId: WorldContinentId;
  label: string;
}

export const worldContinents: { id: WorldContinentId; label: string }[] = [
  { id: "africa", label: "Africa" },
  { id: "americas", label: "Americas" },
  { id: "asia", label: "Asia" },
  { id: "europe", label: "Europe" },
  { id: "oceania", label: "Oceania" },
];

export const worldSubregions: WorldSubregion[] = [
  { id: "northern-africa", continentId: "africa", label: "Northern Africa" },
  { id: "western-africa", continentId: "africa", label: "Western Africa" },
  { id: "central-africa", continentId: "africa", label: "Central Africa" },
  { id: "eastern-africa", continentId: "africa", label: "Eastern Africa" },
  { id: "southern-africa", continentId: "africa", label: "Southern Africa" },
  { id: "northern-america", continentId: "americas", label: "Northern America" },
  { id: "central-america", continentId: "americas", label: "Central America" },
  { id: "caribbean", continentId: "americas", label: "Caribbean" },
  { id: "south-america", continentId: "americas", label: "South America" },
  { id: "western-asia", continentId: "asia", label: "Western Asia" },
  { id: "central-asia", continentId: "asia", label: "Central Asia" },
  { id: "southern-asia", continentId: "asia", label: "Southern Asia" },
  { id: "eastern-asia", continentId: "asia", label: "Eastern Asia" },
  { id: "south-eastern-asia", continentId: "asia", label: "South-eastern Asia" },
  { id: "northern-europe", continentId: "europe", label: "Northern Europe" },
  { id: "western-europe", continentId: "europe", label: "Western Europe" },
  { id: "eastern-europe", continentId: "europe", label: "Eastern Europe" },
  { id: "southern-europe", continentId: "europe", label: "Southern Europe" },
  { id: "australia-new-zealand", continentId: "oceania", label: "Australia and New Zealand" },
  { id: "melanesia", continentId: "oceania", label: "Melanesia" },
  { id: "micronesia", continentId: "oceania", label: "Micronesia" },
  { id: "polynesia", continentId: "oceania", label: "Polynesia" },
];

const originToSubregion: Record<string, WorldSubregionId> = {
  Madrid: "southern-europe",
  Lagos: "western-africa",
  London: "northern-europe",
  Budapest: "eastern-europe",
  Cairo: "northern-africa",
  Milan: "southern-europe",
  Hamburg: "western-europe",
  Kyoto: "eastern-asia",
  Krakow: "eastern-europe",
  Stockholm: "northern-europe",
  Lyon: "western-europe",
  Oslo: "northern-europe",
  Valencia: "southern-europe",
  Dubai: "western-asia",
  Mumbai: "southern-asia",
  Zurich: "western-europe",
  Casablanca: "northern-africa",
  Gothenburg: "northern-europe",
  Singapore: "south-eastern-asia",
  Vienna: "western-europe",
  Lisbon: "southern-europe",
  Munich: "western-europe",
  Beirut: "western-asia",
  Toronto: "northern-america",
  Rome: "southern-europe",
  Accra: "western-africa",
  Prague: "eastern-europe",
  Santiago: "south-america",
  Copenhagen: "northern-europe",
  Dublin: "northern-europe",
  Paris: "western-europe",
  Sofia: "eastern-europe",
  Tunis: "northern-africa",
  Manchester: "northern-europe",
};

const originToCountry: Record<string, string> = {
  Madrid: "Spain",
  Lagos: "Nigeria",
  London: "United Kingdom",
  Budapest: "Hungary",
  Cairo: "Egypt",
  Milan: "Italy",
  Hamburg: "Germany",
  Kyoto: "Japan",
  Krakow: "Poland",
  Stockholm: "Sweden",
  Lyon: "France",
  Oslo: "Norway",
  Valencia: "Spain",
  Dubai: "United Arab Emirates",
  Mumbai: "India",
  Zurich: "Switzerland",
  Casablanca: "Morocco",
  Gothenburg: "Sweden",
  Singapore: "Singapore",
  Vienna: "Austria",
  Lisbon: "Portugal",
  Munich: "Germany",
  Beirut: "Lebanon",
  Toronto: "Canada",
  Rome: "Italy",
  Accra: "Ghana",
  Prague: "Czechia",
  Santiago: "Chile",
  Copenhagen: "Denmark",
  Dublin: "Ireland",
  Paris: "France",
  Sofia: "Bulgaria",
  Tunis: "Tunisia",
  Manchester: "United Kingdom",
};

export function subregionById(id: WorldSubregionId): WorldSubregion {
  const found = worldSubregions.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown world subregion ${id}`);
  return found;
}

export function continentLabel(id: WorldContinentId): string {
  return worldContinents.find((item) => item.id === id)?.label ?? id;
}

export function regionFromOrigin(origin: string): WorldSubregionId {
  return originToSubregion[origin] ?? "western-europe";
}

export function countryFromOrigin(origin: string): string {
  return originToCountry[origin] ?? "Unknown";
}

export function formatGuestRegion(subregionId: WorldSubregionId): string {
  const subregion = subregionById(subregionId);
  return `${continentLabel(subregion.continentId)} · ${subregion.label}`;
}

export const worldSubregionLabels = worldSubregions.map((item) => item.label);

export function subregionsForContinent(continentId: WorldContinentId): WorldSubregion[] {
  return worldSubregions.filter((item) => item.continentId === continentId);
}
