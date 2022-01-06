use std::ops::Div;
use anchor_lang::prelude::*;
use spl_token::{ui_amount_to_amount, amount_to_ui_amount};
use crate::ErrorCode;
use crate::utils::constants::DECIMALS;
use crate::utils::constants::CUT_PERCENTAGE;

/**
*
* This file includes a lot of logic to cover to calculate
* (1) The market rate
* (2) Calculate how much redeemables should be distributed when someone deposity Solana
* (3) Calculate how much solana should be distributed, when someone wants to sell redeemables
*
* The relationship has to stay constant
*
* R_T => Total Redeemables
* S_T => Total Solana
* R_delta => How much additional Redeemables is just paid-in
* S_delta => How much additional Solana is just paid-in
* R_T / S_T = ( R_T + R_delta )/ ( S_T + S_delta )
*
*/

// const CUT_PERCENTAGE: f64 = 0.15;



/**
* We follow the following formula to calculate how many more redeemables to add,
* based on how much Solana was paid in by the user
*
* In the above formula, we are looking for R_delta
* The formula for this is (expanding for R_delta)
*
* R_delta = (R_T / S_T) * (S_T + S_delta) - R_T
*
* Watch out for underflows, overflows, and truncation errors!
*
*/
pub fn calculate_redeemables_to_be_distributed(
    currency_total_supply_raw: u64,
    redeemable_total_supply_raw: u64,
    delta_currency_added_raw: u64
) -> Result<u64, ErrorCode> {

    // TODO: Write rust unittests for these

    // Turn everything into u128 first
    let S_T = currency_total_supply_raw as u128;
    let R_T = redeemable_total_supply_raw as u128;
    let S_delta = delta_currency_added_raw as u128;

    if (currency_total_supply_raw == 0) || (redeemable_total_supply_raw == 0) {
        // Return as many tokens as there is solana, if no solana has been paid in already
        msg!("Initiating a new pool TokenSupply: {}, PoolReserve: {}, Amount: {}",
            redeemable_total_supply_raw,
            currency_total_supply_raw,
            delta_currency_added_raw);
        return Ok(delta_currency_added_raw);
    }

    // Lamports should be automatically accounted for
    // Make sure there are no weird floating point operations
    // No floating points, no error
    let m1 = S_T.checked_add(S_delta).ok_or_else( | | {ErrorCode::CustomMathError5})?;
    let m2 = m1.checked_mul(R_T).ok_or_else( | | {ErrorCode::CustomMathError6})?;
    let m3 = m2.checked_div(S_T).ok_or_else( | | {ErrorCode::CustomMathError7})?;
    let out = m3.checked_sub(R_T).ok_or_else( | | {ErrorCode::CustomMathError8})?;

    return Ok(out as u64);

}

/**
*
* We follow the following formula to calculate how many more redeemables to add,
* based on how many redeemable-tokens were paid in by the user
*
* In the above formula, we are looking for R_delta
* The formula for this is (expanding for R_delta)
*
* S_delta = (S_T / R_T) * (R_T + R_delta) - S_T
*
* * Watch out for underflows, overflows, and truncation errors!
*/
pub fn calculate_currency_token_to_be_distributed(
    currency_total_supply_raw: u64,
    redeemable_total_supply_raw: u64,
    delta_redeemables_burned_raw: u64
) -> Result<u64, ErrorCode> {

    let S_T = currency_total_supply_raw as u128;
    let R_T= redeemable_total_supply_raw as u128;
    let R_delta = delta_redeemables_burned_raw as u128;

    let m1 = R_T.checked_add(R_delta).ok_or_else(| | {ErrorCode::CustomMathError1})?;
    let m2 = m1.checked_mul(S_T).ok_or_else(| | {ErrorCode::CustomMathError2})?;
    let m3 = m2.checked_div(R_T).ok_or_else(| | {ErrorCode::CustomMathError3})?;
    let out = m3.checked_sub(S_T).ok_or_else(| | {ErrorCode::CustomMathError4})?;

    return Ok(out as u64);
}

/**
* Calculate how much profits to pay out to the user
* Calculate how much of the profits should be distributed to the owner of the bond contract
* Returns both how much the bond owner receives, as well as the
*
* Calculate the profits that were generated ever since the values were paid in
*     This is required for multiple reasons
*     (1) Figure out how much profit to redirect to the DAO
*     (2) Figure out how much profits to pay out when the bond has not expired yet
*
*   We can use sol_to_lamports also for our token, because it has 9 decimal figures, just like the solana native token
*   Maybe Replace "initial" by "last". The "initial" will just be a subcase of "last"
*/
pub fn calculate_profits_and_carry(
    token_to_be_distributed_raw: u64,
    token_initially_paid_raw: u64
) -> (u64, u64) {

    let profits: u64 = token_to_be_distributed_raw - token_initially_paid_raw;
    // Gotta make this checked
    // TODO: Do proper casting and multiplication
    let carry: u64 = ( (profits as f64) * CUT_PERCENTAGE) as u64;
    let profits_after_carry: u64 = profits - carry;

    return (profits_after_carry, carry);
}