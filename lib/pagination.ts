export type Pagination = {
  page: number;
  pageSize: number;
  offset: number;
};

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getPagination(searchParams: URLSearchParams): Pagination {
  const page = positiveInteger(searchParams.get("page"), 1);
  const pageSize = Math.min(positiveInteger(searchParams.get("limit"), 8), 50);

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  };
}

export function getVisiblePages(current: number, total: number) {
  const start = Math.max(1, Math.min(current - 2, total - 4));
  const end = Math.min(total, start + 4);
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
}
