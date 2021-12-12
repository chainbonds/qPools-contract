use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

use amm::instructions::swap::Swap;
use amm::program::Amm;
use amm::cpi;

use crate::ErrorCode;
use crate::state::BondPoolAccount;
use crate::utils::functional::calculate_redeemables_to_be_distributed;

#[derive(Accounts)]
// #[instruction(amount)]
pub struct DepositReserveToPools<'info> {

    // Provide all pool-addresses that we will be depositing amounts to
    pub currency_mint: Account<'info, Mint>,

    // The bond pool account
    #[account(mut)]
    pub bond_pool_account: Box<Account<'info, BondPoolAccount>>,

    pub bond_pool_currency_account: Account<'info, TokenAccount>,

    pub amm: Program<'info,Amm>,

    // The standard accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

/*
    Based on the portfolio and weights, calculate how much to re-distribute into each pool
*/
// TODO: Replace everything by decimals?
pub fn calculate_amount_per_pool(x: u64) -> [u64; 5] {

    let default_pay_in_amount: u64 = x / 5;

    return [default_pay_in_amount, default_pay_in_amount, default_pay_in_amount, default_pay_in_amount, default_pay_in_amount];
}

pub fn swap_to_currency() {

    amm::cpi::swap();

    let cpi_program = ctx.accounts.amm.to_account_info();
    let cpi_accounts = Swap {
        // State
        state: ctx.accounts.amm.to_account_info(),
        // Pool
        pool: ctx.accounts.amm.to_account_info(),
        // Tickmap
        tickmap: ctx.accounts.amm.to_account_info(),
        // Mints
        token_x: ctx.accounts.amm.to_account_info(),
        token_y: ctx.accounts.amm.to_account_info(),
        // Tokens
        reserve_x: ctx.accounts.amm.to_account_info(),
        reserve_y: ctx.accounts.amm.to_account_info(),
        account_x: ctx.accounts.amm.to_account_info(),
        account_y: ctx.accounts.amm.to_account_info(),
        // Accounts
        owner: ctx.accounts.amm.to_account_info(),
        // Default / Misc
        program_authority: ctx.accounts.amm.to_account_info(),
        token_program: ctx.accounts.amm.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    zero_copy::cpi::update_bar(
        cpi_ctx,
       _fee_tier_address: Pubkey,
       x_to_y: bool,
       amount: u64,
       by_amount_in: bool,  // whether amount specifies input or output
       sqrt_price_limit: u128
    );

}

/**
    Deposit reserve to pools.
    All the Solana tokens that are within the reserve,
    are now put into
 */
pub fn handler(ctx: Context<DepositReserveToPools>) -> ProgramResult {
    msg!("Depositing reserve to pools!");



    // Calculate how much currency is in the bond
    let available_currency: u64 = ctx.accounts.bond_pool_currency_account.amount;

    // For now, assume we provide the same amount of liquidity to all pools
    // So we don't have to calculate the weightings
    let fraction_per_pool = calculate_amount_per_pool(available_currency);

    // Make swaps, and deposit this much to the pool
    for i in 0..fraction_per_pool.len() {

    }

    Ok(())
}