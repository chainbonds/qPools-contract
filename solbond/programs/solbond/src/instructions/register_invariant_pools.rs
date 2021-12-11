use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::{BondPoolAccount, InvariantPoolList};

#[derive(Accounts)]
// #[instruction()]
pub struct RegisterInvariantPools<'info> {

    // pub invariant_pools
    // pub pool_list: Vec<amm::structs::pool::Pool>,
    pub pool_list: Account<'info, InvariantPoolList>,

    // The standards accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<RegisterInvariantPools>) -> ProgramResult {

    /*
        As Input, have a list of Pool Accounts
     */


    // Initialize a position in all of the pools


    Ok(())
}


