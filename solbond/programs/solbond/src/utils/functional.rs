use anchor_lang::prelude::*;
use spl_token::{ui_amount_to_amount, amount_to_ui_amount};
use super::constants::DECIMALS;
use super::constants::CUT_PERCENTAGE;

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
*
*
*/
pub fn calculate_redeemables_to_be_distributed(
    token_total_supply_raw: u64,
    redeemable_total_supply_raw: u64,
    delta_token_added_raw: u64
) -> u64 {

    if (token_total_supply_raw == 0) || (redeemable_total_supply_raw == 0) {
        // Return as many tokens as there is solana, if no solana has been paid in already
        msg!("Initiating a new pool TokenSupply: {}, PoolReserve: {}, Amount: {}",
            redeemable_total_supply_raw,
            token_total_supply_raw,
            delta_token_added_raw);
        return delta_token_added_raw;
    }

    // TODO: Make sure there are no weird floatin point operations
    let token_total_supply: f64 = amount_to_ui_amount(token_total_supply_raw, DECIMALS);
    let redeemable_total_supply: f64 = amount_to_ui_amount(redeemable_total_supply_raw, DECIMALS);
    let delta_token_added: f64 = amount_to_ui_amount(delta_token_added_raw, DECIMALS);

    // Double-check this formula!
    let market_rate_t0: f64 = redeemable_total_supply / token_total_supply;
    let _out: f64 =  market_rate_t0 * (token_total_supply + delta_token_added);
    let out = _out - redeemable_total_supply;
    // R_T / S_T = ( R_T + R_delta )/ ( S_T + S_delta )
    // Convert back to lamports
    return ui_amount_to_amount(out, DECIMALS);
}

pub fn calculate_token_to_be_distributed(
    token_total_supply_raw: u64,
    redeemable_total_supply_raw: u64,
    delta_redeemables_burned_raw: u64
) -> u64 {
    // TODO: Make sure there are no weird floatin point operations
    let token_total_supply: f64 = amount_to_ui_amount(token_total_supply_raw, DECIMALS);
    let redeemable_total_supply: f64 = amount_to_ui_amount(redeemable_total_supply_raw, DECIMALS);
    let delta_redeemables_burned: f64 = amount_to_ui_amount(delta_redeemables_burned_raw, DECIMALS);

    let market_rate_t0: f64 = token_total_supply / redeemable_total_supply;
    let _out: f64 = market_rate_t0 * (redeemable_total_supply - delta_redeemables_burned);
    let out: f64 = _out - redeemable_total_supply;


    // Convert back to lamports
    return ui_amount_to_amount(out, DECIMALS);
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