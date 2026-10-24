const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const invoiceDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US");

export function money(value: unknown) {
  const n = Number(value ?? 0);
  return moneyFormatter.format(Number.isFinite(n) ? n : 0);
}

export function dateInputValue(value: Date | string | null | undefined) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function formatInvoiceDate(value: string | Date | null | undefined) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y,m,d] = value.slice(0,10).split("-").map(Number);
    return invoiceDateFormatter.format(new Date(y, m - 1, d));
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return invoiceDateFormatter.format(d);
}

export function formatShortDate(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return shortDateFormatter.format(date);
}
