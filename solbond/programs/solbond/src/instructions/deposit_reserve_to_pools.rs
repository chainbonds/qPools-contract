use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

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

/**
    Deposit reserve to pools.
    All the Solana tokens that are within the reserve,
    are now put into
 */
pub fn handler(ctx: Context<DepositReserveToPools>) -> ProgramResult {
    msg!("Depositing reserve to pools!");

    // For now, assume we provide the same amount of liquidity to all pools
    // So we don't have to calculate the weightings
    // calculate_amount_per_pool();

    Ok(())
}