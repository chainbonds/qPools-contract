use solana_program::program::{invoke, invoke_signed};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_lang::solana_program::native_token::{lamports_to_sol, sol_to_lamports};
use anchor_spl::token::{self, Burn, Mint, TokenAccount, Token, MintTo};

use crate::{
    ErrorCode,
    BondInstanceAccount,
    BondPoolAccount,
    RedeemBondInstance
};

/*
    TODO 1:
        Move some of the profits in both cases to the generator / initiator of the bond_pool_account (owner)

    TODO 2:
        Make checks whenever there is a division for division by zero, etc.

*/

const CUT_PERCENTAGE: f64 = 0.2;

/**
* Calculate the profits that were generated ever since the values were paid in
*     This is required for multiple reasons
*     (1) Figure out how much profit to redirect to the DAO
*     (2) Figure out how much profits to pay out when the bond has not expired yet
*
*   We can use sol_to_lamports also for our token, because it has 9 decimal figures, just like the solana native token
*   Maybe Replace "initial" by "last". The "initial" will just be a subcase of "last"
*/
// TODO: Update the number of tokens in the struct, after it was paid out
// TODO: How does this work with estimating how much solana to pay out,
// and re-structuring the reserve
fn calculate_market_rate(reserve_total_supply_in_lamports: u64, token_total_supply_in_lamports: u64) -> f64 {
    let total_token_supply: f64 = lamports_to_sol(token_total_supply_in_lamports);
    let total_pool_reserve: f64 = lamports_to_sol(reserve_total_supply_in_lamports);
    return total_token_supply / total_pool_reserve;
}

fn calculate_profits(ctx: Context<RedeemBondInstance>) -> (f64, f64, f64) {

    // Get full amount in redeemables
    let bond_pool_account = &mut ctx.accounts.bond_pool_account;
    let bond_instance_account = &mut ctx.accounts.bond_instance_account;

    // Some Global Stats
    let market_rate_tokens_per_reserve: f64 = calculate_market_rate(
        ctx.accounts.bond_pool_solana_account.lamports(),
        ctx.accounts.bond_pool_redeemable_mint.supply
    );

    // Must read out first, because calculations depend on this
    let redeemables_representing_total_share: f64 = lamports_to_sol(ctx.accounts.bond_instance_token_account.amount);
    // User Stats w.r.t. Solana
    let initial_amount_in_solana_owned_by_user: f64 = lamports_to_sol(bond_instance_account.initial_payin_amount_in_lamports);
    let total_amount_in_solana_owned_by_user: f64 = total_amount_tokens_owned_by_user / market_rate_tokens_per_reserve;
    // User Stats w.r.t. Redeemable Tokens
    let redeemables_representing_initial_share: f64 = initial_amount_in_solana_owned_by_user * market_rate_tokens_per_reserve;
    let redeemables_representing_profit: f64 = redeemables_owned_by_user - redeemables_representing_initial_share;

    // Calculate cuts, shares, etc. in tokens
    let redeemables_representing_community_profit = redeemables_representing_profit * CUT_PERCENTAGE;
    let redeemables_representing_payback_profit = redeemables_representing_profit - redeemables_representing_community_profit;

    // Translates everything also back into solana ...
    // Or let the calling program do this for you

    // I guess the initially_received_redeemable_tokens
    // and the total_amount_tokens_owned_by_user
    // should be the same?
    // what is the difference between the two, actually

    // Calculate how much profits to keep

    msg!("Redeemables to be paid out: {}, and kept are: {}", redeemables_representing_profit, redeemables_representing_initial_share);
    msg!("Total amount of tokens is: {}, summing up is: {}", redeemables_owned_by_user, redeemables_representing_profit + redeemables_representing_initial_share);

    let out = (redeemables_representing_initial_share, redeemables_representing_payback_profit, redeemables_representing_community_profit);

    return out;

}

/**
 * Calculate how many of the profits to pay out
 */
pub fn redeem_bond_instance_profits_only(ctx: Context<RedeemBondInstance>) -> ProgramResult {

    let bond_instance_account = &mut ctx.accounts.bond_instance_account;
    /*
    * Step 1: Calculate market rate
    */
    // If the user takes out anything, the timeframe then is also updated.
    let owned_solana_amount_in_lamports: u64 = sol_to_lamports(
        lamports_to_sol(ctx.accounts.bond_pool_solana_account.lamports()) /
            lamports_to_sol(ctx.accounts.bond_pool_redeemable_mint.supply) *
            // TODO: Be careful here, make sure the redeemables' decimals are maybe recorded somewhere, right now we can do this because our token has 9 decimals
            lamports_to_sol(full_amount_in_redeemables)
    );

    // Gotta make sure that the payout amount is higher than the initially paid-in amount.
    if owned_solana_amount_in_lamports < bond_instance_account.initial_payin_amount_in_lamports {
        msg!("This error should not happen: {} {}", owned_solana_amount_in_lamports, bond_instance_account.initial_payin_amount_in_lamports);
        return Err(ErrorCode::PayoutError.into());
    };
    // Calculate how much to actually pay out
    let payout_amount_in_lamports: u64 = owned_solana_amount_in_lamports - bond_instance_account.initial_payin_amount_in_lamports;

    // Update how many redeemables to actually keep
    // And how many redeemables to get rid of

    // Calculate how much redeemables to keep
    // TODO: Check if division by zero, and prevent if it is so
    let keep_redeemable_amount = sol_to_lamports(lamports_to_sol(bond_instance_account.initial_payin_amount_in_lamports) / lamports_to_sol(ctx.accounts.bond_pool_solana_account.lamports()));
    // TODO: Check for nan and infinity
    let burn_redeemable_amount = full_amount_in_redeemables - keep_redeemable_amount;

    // Or simply just do an assert
    if (keep_redeemable_amount + burn_redeemable_amount) != owned_solana_amount_in_lamports {
        msg!("Calculation doesnt add up! {} {} {}", keep_redeemable_amount, burn_redeemable_amount, owned_solana_amount_in_lamports);
        return Err(ErrorCode::Calculation.into());
    }

    // TODO: Assert that this is the same as when we calculate
    // Perhaps do this test only on the front-end

    // let bond_instance_account = &mut ctx.accounts.bond_instance_account;
    if ctx.accounts.purchaser_token_account.to_account_info().lamports() > owned_solana_amount_in_lamports {
        return Err(ErrorCode::RedeemCapacity.into());
    }
    if ctx.accounts.purchaser_token_account.to_account_info().lamports() > burn_redeemable_amount {
        return Err(ErrorCode::RedeemCapacity.into());
    }

    /*
     * Step 2: Burn Bond Token
     */
    let cpi_accounts = Burn {
        mint: ctx.accounts.bond_pool_redeemable_mint.to_account_info(),
        to: ctx.accounts.bond_instance_token_account.to_account_info(),
        authority: ctx.accounts.bond_instance_account.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    token::burn(
        CpiContext::new_with_signer(
            cpi_program,
            cpi_accounts,
            &[
                [
                    ctx.accounts.bond_instance_account.purchaser.key().as_ref(), b"bondInstanceAccount",
                    &[ctx.accounts.bond_instance_account.bump_bond_instance_account]
                ].as_ref(),
                [
                    ctx.accounts.bond_pool_account.generator.key().as_ref(), b"bondPoolAccount",
                    &[ctx.accounts.bond_pool_account.bump_bond_pool_account]
                ].as_ref()
            ]
        ), burn_redeemable_amount)?;

    /*
     * Step 3: Pay out Solana
     *     Can later on replace this with paying out redeemables,
     *      and the user can call another function to replace the redeemables with the bond
     */
    let res = anchor_lang::solana_program::system_instruction::transfer(
        ctx.accounts.bond_pool_solana_account.to_account_info().key,
        ctx.accounts.purchaser.to_account_info().key,
        payout_amount_in_lamports,
    );
    invoke_signed(
        &res,
        &[ctx.accounts.bond_pool_solana_account.to_account_info(), ctx.accounts.purchaser.to_account_info()],
        &[[
            ctx.accounts.bond_pool_account.key().as_ref(), b"bondPoolSolanaAccount",
            &[ctx.accounts.bond_pool_account.bump_bond_pool_solana_account]
        ].as_ref()]
    )?;

    Ok(())
}

// TODO: Move this into a different file

/**
 * Returns everything that is owned as redeemables.
 * Account will not include any more redeemables after this!
 * There is no need to update the redeemables after this, because of this
 */
pub fn redeem_bond_instance_face_value_and_profits(ctx: Context<RedeemBondInstance>) -> ProgramResult {

    let bond_instance_account = &mut ctx.accounts.bond_instance_account;
    // Update when the last payout happened ...
    bond_instance_account.last_profit_payout = ctx.accounts.clock.unix_timestamp as u64;

    // We can finally delete this account-data!
    if (ctx.accounts.clock.unix_timestamp as u64) < bond_instance_account.end_time {
        return Err(ErrorCode::TimeFrameNotPassed.into());
    }

    /*
    * Step 1: Calculate market rate
    */
    let full_amount_in_redeemables = ctx.accounts.bond_instance_token_account.amount;
    // If the user takes out anything, the timeframe then is also updated.

    // Calculate current worth,
    // minus initial pay-in-amount
    let payout_amount_in_lamports: u64 = sol_to_lamports(
        lamports_to_sol(ctx.accounts.bond_pool_solana_account.lamports()) /
            lamports_to_sol(ctx.accounts.bond_pool_redeemable_mint.supply) *
            // TODO: Be careful here, make sure the redeemables' decimals are maybe recorded somewhere, right now we can do this because our token has 9 decimals
            lamports_to_sol(full_amount_in_redeemables)
    );

    /*
     * Step 2: Burn Bond Token
     */
    let cpi_accounts = Burn {
        mint: ctx.accounts.bond_pool_redeemable_mint.to_account_info(),
        to: ctx.accounts.bond_instance_token_account.to_account_info(),
        authority: ctx.accounts.bond_instance_account.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    token::burn(
        CpiContext::new_with_signer(
            cpi_program,
            cpi_accounts,
            &[
                [
                    ctx.accounts.bond_instance_account.purchaser.key().as_ref(), b"bondInstanceAccount",
                    &[ctx.accounts.bond_instance_account.bump_bond_instance_account]
                ].as_ref(),
                [
                    ctx.accounts.bond_pool_account.generator.key().as_ref(), b"bondPoolAccount",
                    &[ctx.accounts.bond_pool_account.bump_bond_pool_account]
                ].as_ref()
            ]
        ), full_amount_in_redeemables)?;

    /*
     * Step 3: Pay out Solana
     *     Can later on replace this with paying out redeemables,
     *      and the user can call another function to replace the redeemables with the bond
     */
    let res = anchor_lang::solana_program::system_instruction::transfer(
        ctx.accounts.bond_pool_solana_account.to_account_info().key,
        ctx.accounts.purchaser.to_account_info().key,
        payout_amount_in_lamports,
    );
    invoke_signed(
        &res,
        &[ctx.accounts.bond_pool_solana_account.to_account_info(), ctx.accounts.purchaser.to_account_info()],
        &[[
            ctx.accounts.bond_pool_account.key().as_ref(), b"bondPoolSolanaAccount",
            &[ctx.accounts.bond_pool_account.bump_bond_pool_solana_account]
        ].as_ref()]
    )?;

    Ok(())

}