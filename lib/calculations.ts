export type InvoiceLineInput = {
  id: string;
  name: string;
  description: string;
  qty: number;
  rate: number;
  discountType: "percent" | "fixed";
  discountValue: number;
  taxable: boolean;
};

export type CalculatedLine = InvoiceLineInput & {
  gross: number;
  discountAmount: number;
  net: number;
  taxAmount: number;
  amount: number;
};

const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function calculateInvoice(
  lines: InvoiceLineInput[],
  taxEnabled: boolean,
  taxRate: number,
) {
  const calculated: CalculatedLine[] = lines.map((line) => {
    const qty = Math.max(0, Number(line.qty) || 0);
    const rate = Math.max(0, Number(line.rate) || 0);
    const gross = money(qty * rate);

    const rawDiscount =
      line.discountType === "percent"
        ? gross * (Math.max(0, Number(line.discountValue) || 0) / 100)
        : Math.max(0, Number(line.discountValue) || 0);

    const discountAmount = money(Math.min(gross, rawDiscount));
    const net = money(gross - discountAmount);
    const taxAmount = taxEnabled && line.taxable ? money(net * (taxRate / 100)) : 0;
    const amount = money(net + taxAmount);

    return {
      ...line,
      qty,
      rate,
      gross,
      discountAmount,
      net,
      taxAmount,
      amount,
    };
  });

  const subtotal = money(calculated.reduce((s, l) => s + l.gross, 0));
  const discount = money(calculated.reduce((s, l) => s + l.discountAmount, 0));
  const taxableSubtotal = money(
    calculated.filter((l) => l.taxable).reduce((s, l) => s + l.net, 0),
  );
  const tax = taxEnabled ? money(taxableSubtotal * (taxRate / 100)) : 0;
  const total = money(subtotal - discount + tax);

  return { lines: calculated, subtotal, discount, tax, total };
}
