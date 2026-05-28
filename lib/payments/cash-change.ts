export interface CashChangeInput {
  total: number;
  received: number;
}

export interface CashChangeResult {
  change: number;
  remaining: number;
  isEnough: boolean;
}

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function calculateCashChange({
  total,
  received,
}: CashChangeInput): CashChangeResult {
  const roundedTotal = roundMoney(total);
  const roundedReceived = roundMoney(received);
  const difference = roundMoney(roundedReceived - roundedTotal);

  return {
    change: difference > 0 ? difference : 0,
    remaining: difference < 0 ? roundMoney(Math.abs(difference)) : 0,
    isEnough: difference >= 0,
  };
}
