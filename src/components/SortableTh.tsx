import { categoryLabels, type Category } from "../data/shift";

export type SortKey = "guest" | "room" | "category";
export type SortDir = "asc" | "desc";

export function nextSort(
  currentKey: SortKey | null,
  currentDir: SortDir,
  clicked: SortKey,
): { key: SortKey; dir: SortDir } {
  if (currentKey === clicked) {
    return { key: clicked, dir: currentDir === "asc" ? "desc" : "asc" };
  }
  return { key: clicked, dir: "asc" };
}

export function compareByGuestOrRoom(
  aName: string,
  aRoom: string,
  bName: string,
  bRoom: string,
  key: Exclude<SortKey, "category">,
  dir: SortDir,
): number {
  const mul = dir === "asc" ? 1 : -1;
  if (key === "guest") return mul * aName.localeCompare(bName, undefined, { sensitivity: "base" });
  return mul * aRoom.localeCompare(bRoom, undefined, { numeric: true, sensitivity: "base" });
}

export function compareByCategory(a: Category, b: Category, dir: SortDir): number {
  const mul = dir === "asc" ? 1 : -1;
  return mul * categoryLabels[a].localeCompare(categoryLabels[b], undefined, { sensitivity: "base" });
}

export function SortableTh({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey | null;
  direction: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = activeKey === sortKey;
  return (
    <th aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        className={active ? "sort-th is-active" : "sort-th"}
        onClick={() => onSort(sortKey)}
      >
        <span>{label}</span>
        <span className="sort-th-indicator" aria-hidden="true">
          {active ? (direction === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}
