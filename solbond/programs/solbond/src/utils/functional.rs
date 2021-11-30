use anchor_lang::solana_program::native_token::{lamports_to_sol, sol_to_lamports};

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

const CUT_PERCENTAGE: f64 = 0.15;

/**
* We shouldn't really ever have to calculate this formula
*/
// Should probably calculate everything lamports
fn calculate_market_rate_redeemables_per_solana(
    reserve_total_supply_in_lamports: u64,
    token_total_supply_in_lamports: u64
) -> f64 {
    let total_token_supply: f64 = lamports_to_sol(token_total_supply_in_lamports);
    let total_pool_reserve: f64 = lamports_to_sol(reserve_total_supply_in_lamports);
    return total_token_supply / total_pool_reserve;
}

/**
* We follow the following formula to calculate how many more redeemables to add,
* based on how much Solana was paid in by the user
*
*
*
*/
fn calculate_redeemables_to_be_distributed(
    solana_total_supply_in_lamports: u64,
    token_total_supply_in_lamports: u64,
    delta_solana_added_in_lamports: u64
) -> u64 {

    if (token_total_supply_in_lamports == 0) || (solana_total_supply_in_lamports == 0) {
        // Return as many tokens as there is solana, if no solana has been paid in already
        msg!("Initiating a new pool TokenSupply: {}, PoolReserve: {}, Amount: {}", token_total_supply_in_lamports, solana_total_supply_in_lamports, delta_solana_added_in_lamports);
        return delta_solana_added_in_lamports;
    }

    // TODO: Make sure there are no weird floatin point operations
    let solana_total_supply = lamports_to_sol(solana_total_supply_in_lamports);
    let token_total_supply = lamports_to_sol(token_total_supply_in_lamports);
    let delta_solana_added = lamports_to_sol(delta_solana_added_in_lamports);

    // Double-check this formula!
    let market_rate_t0: f64 = token_total_supply / solana_total_supply;
    let out: f64 =  market_rate_t0 * (solana_total_supply + delta_solana_added);
    out -= token_total_supply;
    // R_T / S_T = ( R_T + R_delta )/ ( S_T + S_delta )
    // Convert back to lamports
    return sol_to_lamports(out);
}

fn calculate_solana_to_be_distributed(
    solana_total_supply_in_lamports: u64,
    token_total_supply_in_lamports: u64,
    delta_redeemables_burned_in_lamports: u64
) -> u64 {
    // TODO: Make sure there are no weird floatin point operations
    let solana_total_supply = lamports_to_sol(solana_total_supply_in_lamports);
    let token_total_supply = lamports_to_sol(token_total_supply_in_lamports);
    let delta_redeemables_burned = lamports_to_sol(delta_redeemables_burned_in_lamports);

    let market_rate_t0: f64 = solana_total_supply / token_total_supply;
    let out = market_rate_t0 * (token_total_supply - delta_redeemables_burned);
    out -= token_total_supply;

    // Convert back to lamports
    return sol_to_lamports(out);
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
fn calculate_profits_and_carry(
    solana_to_be_distributed_in_lamports: u64,
    solana_initially_paid_in_lamports: u64
) -> (u64, u64) {

    let profits: u64 = solana_to_be_distributed_in_lamports - solana_initially_paid_in_lamports;
    // Gotta make this checked
    let carry: u64 = profits * CUT_PERCENTAGE;
    let profits_after_carry: u64 = profits - carry;

    return (profits_after_carry, carry);
}