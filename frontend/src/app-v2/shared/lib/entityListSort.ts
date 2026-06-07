export type EntitySortOption =
  | "created-desc"
  | "created-asc"
  | "updated-desc"
  | "name-asc";

export const ENTITY_SORT_OPTIONS: { value: EntitySortOption; label: string }[] = [
  { value: "created-desc", label: "Date created (newest)" },
  { value: "created-asc", label: "Date created (oldest)" },
  { value: "updated-desc", label: "Recently updated" },
  { value: "name-asc", label: "Name (A–Z)" },
];

export interface EntitySortable {
  name: string;
  createdAt: string;
  updatedAt: string;
}

export function sortByEntityOption<T extends EntitySortable>(
  items: T[],
  option: EntitySortOption
): T[] {
  const sorted = [...items];
  switch (option) {
    case "created-desc":
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case "created-asc":
      return sorted.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    case "updated-desc":
      return sorted.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return sorted;
  }
}
