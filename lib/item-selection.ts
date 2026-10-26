export type ItemChoice = {
  id: string;
  name: string;
  description?: string;
  sku?: string;
};

export const RECENT_ITEM_LIMIT = 10;

export function filterItemChoices<T extends ItemChoice>(items: T[], query: string, limit: number) {
  const normalizedQuery = query.trim().toLowerCase();
  const matches = normalizedQuery
    ? items.filter((item) => (
      `${item.name} ${item.description ?? ""} ${item.sku ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery)
    ))
    : items;

  return matches.slice(0, limit);
}
