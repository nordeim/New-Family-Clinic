// lib/utils/chas-calculator.ts
import { type ChasCardType } from "@/types/database.types"; // Assuming ENUM type is generated

type SubsidyRates = {
  consultation: number;
  // In a real scenario, this would be far more complex,
  // involving specific chronic conditions, etc.
};

const CHAS_SUBSIDY_RATES: Record<ChasCardType, SubsidyRates> = {
  blue: { consultation: 18.5 },
  orange: { consultation: 11.0 },
  green: { consultation: 7.5 },
  none: { consultation: 0 },
};

interface CalculationInput {
  chasCardType: ChasCardType;
  consultationFee: number;
}

interface CalculationOutput {
  subsidyAmount: number;
  finalAmount: number;
}

export class CHASCalculator {
  /**
   * Calculates the CHAS subsidy for a given consultation.
   * @param input - The patient's CHAS card type and the consultation fee.
   * @returns An object with the subsidy amount and the final payable amount.
   */
  public static calculate(input: CalculationInput): CalculationOutput {
    const { chasCardType, consultationFee } = input;
    const rates = CHAS_SUBSIDY_RATES[chasCardType] ?? CHAS_SUBSIDY_RATES.none;

    const subsidyAmount = Math.min(consultationFee, rates.consultation);
    const finalAmount = Math.max(0, consultationFee - subsidyAmount);

    return {
      subsidyAmount: parseFloat(subsidyAmount.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2)),
    };
  }
}
