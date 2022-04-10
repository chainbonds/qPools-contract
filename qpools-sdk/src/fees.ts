import { Percent, u64 } from "@saberhq/token-utils";

// import type { RawFees } from "./layout";
export interface RawFees {

    adminWithdrawFeeNumerator: Uint8Array;
    adminWithdrawFeeDenominator: Uint8Array;

    withdrawFeeNumerator: Uint8Array;
    withdrawFeeDenominator: Uint8Array;
  }

export type Fees = {
  withdraw: Percent;
  adminWithdraw: Percent;
};

export const DEFAULT_FEE = new Percent(0, 10000);

export const ZERO_FEES: Fees = {
  /**
   * Fee per trade
   */
  withdraw: DEFAULT_FEE,
  adminWithdraw: DEFAULT_FEE,
};

const recommendedFeesRaw = {

  adminWithdrawFeeNumerator: 50,
  adminWithdrawFeeDenominator: 100,

  withdrawFeeNumerator: 50,
  withdrawFeeDenominator: 10000,
};

export const RECOMMENDED_FEES: Fees = {

  withdraw: new Percent(
    recommendedFeesRaw.withdrawFeeNumerator,
    recommendedFeesRaw.withdrawFeeDenominator
  ),

  adminWithdraw: new Percent(
    recommendedFeesRaw.adminWithdrawFeeNumerator,
    recommendedFeesRaw.adminWithdrawFeeDenominator
  ),
};

export const encodeFees = (fees: Fees): RawFees => ({

  adminWithdrawFeeNumerator: new u64(
    fees.adminWithdraw.numerator.toString()
  ).toBuffer(),
  adminWithdrawFeeDenominator: new u64(
    fees.adminWithdraw.denominator.toString()
  ).toBuffer(),
  withdrawFeeNumerator: new u64(fees.withdraw.numerator.toString()).toBuffer(),
  withdrawFeeDenominator: new u64(
    fees.withdraw.denominator.toString()
  ).toBuffer(),
});

export const decodeFees = (raw: RawFees): Fees => ({
  adminWithdraw: new Percent(
    u64.fromBuffer(Buffer.from(raw.adminWithdrawFeeNumerator)).toString(),
    u64.fromBuffer(Buffer.from(raw.adminWithdrawFeeDenominator)).toString()
  ),
  withdraw: new Percent(
    u64.fromBuffer(Buffer.from(raw.withdrawFeeNumerator)).toString(),
    u64.fromBuffer(Buffer.from(raw.withdrawFeeDenominator)).toString()
  ),
});