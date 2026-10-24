export type PaymentEntryMode = "" | "cash-full" | "card-full" | "custom";

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function paymentValuesForMode(mode: PaymentEntryMode, total: number) {
  const safeTotal = roundMoney(Math.max(0, Number(total) || 0));
  if (mode === "cash-full") return { cash: safeTotal, card: 0 };
  if (mode === "card-full") return { cash: 0, card: safeTotal };
  return { cash: 0, card: 0 };
}

export function paymentInputValue(amount: number) {
  return amount > 0 ? String(amount) : "";
}

export function parsePaymentInput(value: string) {
  if (!value.trim()) return 0;
  return roundMoney(Math.max(0, Number(value) || 0));
}
