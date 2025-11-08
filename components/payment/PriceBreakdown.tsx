// components/payment/PriceBreakdown.tsx
interface PriceBreakdownProps {
  originalAmount: number;
  subsidyAmount: number;
  totalAmount: number;
}

export function PriceBreakdown({ originalAmount, subsidyAmount, totalAmount }: PriceBreakdownProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" }).format(amount);

  return (
    <div className="space-y-2 rounded-lg border bg-neutral-50 p-4">
      <div className="flex justify-between">
        <span>Consultation Fee</span>
        <span>{formatCurrency(originalAmount)}</span>
      </div>
      {subsidyAmount > 0 && (
        <div className="flex justify-between text-green-600">
          <span>CHAS Subsidy</span>
          <span>- {formatCurrency(subsidyAmount)}</span>
        </div>
      )}
      <div className="flex justify-between border-t pt-2 font-bold text-lg">
        <span>Total Payable</span>
        <span>{formatCurrency(totalAmount)}</span>
      </div>
    </div>
  );
}
