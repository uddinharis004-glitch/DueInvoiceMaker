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
