use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::BondPoolAccount;

// use amm::;

#[derive(Accounts)]
// #[instruction()]
pub struct DeployPortfolio<'info> {

    // pub invariant_pools

    // The standards accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<DeployPortfolio>) -> ProgramResult {


    // Initialize a position in all of the pools


    Ok(())
}
