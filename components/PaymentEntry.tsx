"use client";

import { money } from "@/lib/utils";
import { parsePaymentInput, paymentInputValue, type PaymentEntryMode } from "@/lib/payment-entry";

type PaymentEntryProps = {
  mode: PaymentEntryMode;
  total: number;
  cashPaid: number;
  cardPaid: number;
  paymentMade: number;
  paymentDate: string;
  onModeChange: (mode: PaymentEntryMode) => void;
  onCashChange: (amount: number) => void;
  onCardChange: (amount: number) => void;
  onDateChange: (date: string) => void;
};

const paymentChoices: Array<{ mode: Exclude<PaymentEntryMode, "">; title: string; detail: string }> = [
  { mode: "cash-full", title: "Cash", detail: "Paid in full" },
  { mode: "card-full", title: "Card", detail: "Paid in full" },
  { mode: "custom", title: "Custom amount", detail: "Partial or split payment" },
];

export default function PaymentEntry({ mode, total, cashPaid, cardPaid, paymentMade, paymentDate, onModeChange, onCashChange, onCardChange, onDateChange }: PaymentEntryProps) {
  return (
    <fieldset className="fieldset full">
      <legend className="fieldset-legend">How was this invoice paid?</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {paymentChoices.map((choice) => (
          <label key={choice.mode} className={`flex cursor-pointer items-center gap-3 rounded-field border p-3 font-normal ${mode === choice.mode ? "border-neutral bg-base-200" : "border-base-300"}`}>
            <input className="radio" type="radio" name="payment-entry-mode" value={choice.mode} checked={mode === choice.mode} onChange={() => onModeChange(choice.mode)} />
            <span><strong className="block text-sm">{choice.title}</strong><span className="text-xs text-base-content/60">{choice.detail}</span></span>
          </label>
        ))}
      </div>

      {!mode && <p className="label">Choose cash, card, or a custom amount.</p>}
      {mode === "cash-full" && <p className="label">The full invoice total of {money(total)} will be recorded as cash.</p>}
      {mode === "card-full" && <p className="label">The full invoice total of {money(total)} will be recorded as card.</p>}

      {mode === "custom" && (
        <div className="form-grid mt-2">
          <label>Cash amount<input className="input" type="number" inputMode="decimal" min="0" max={total} step="0.01" placeholder="0.00" value={paymentInputValue(cashPaid)} onFocus={(event) => event.currentTarget.select()} onChange={(event) => onCashChange(parsePaymentInput(event.target.value))} /></label>
          <label>Card amount<input className="input" type="number" inputMode="decimal" min="0" max={total} step="0.01" placeholder="0.00" value={paymentInputValue(cardPaid)} onFocus={(event) => event.currentTarget.select()} onChange={(event) => onCardChange(parsePaymentInput(event.target.value))} /></label>
        </div>
      )}

      {mode && (
        <div className="form-grid mt-2">
          <label>Total payment<input className="input" value={paymentMade.toFixed(2)} readOnly /></label>
          <label>Payment date<input className="input" type="date" value={paymentDate} onChange={(event) => onDateChange(event.target.value)} /></label>
        </div>
      )}
    </fieldset>
  );
}
