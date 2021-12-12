use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::{BondPoolAccount, InvariantPoolList};

// Right now, we assume that we can have up to 10 pools

#[derive(Accounts)]
#[instruction(
    _bump_pool_list: u8
)]
pub struct RegisterInvariantPools<'info> {

    #[account(
        init,
        payer = initializer,
        space = 8 + BondPoolAccount::LEN,
        seeds = [initializer.key.as_ref(), b"poolList"], bump = _bump_pool_list
    )]
    pub pool_list: Account<'info, InvariantPoolList>,

    // Take in a list of pool addresses
    pub pool_list_addresses: Account<'info, [Pubkey; 10]>,
    // Take in a list of pool weights
    pub pool_list_weights: Account<'info, [u64; 10]>,

    #[account(signer, mut)]
    pub initializer: AccountInfo<'info>,

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

    let pool_list = &mut ctx.accounts.pool_list;

    let pool_list_addresses = *ctx.accounts.pool_list_addresses;
    let pool_list_weights = *ctx.accounts.pool_list_weights;

    // Iterate through the pools
    for i in 1..10 {
        pool_list.pool_addresses[i] = pool_list_addresses[i];
        pool_list.pool_weights[i] = pool_list_weights[i];
    }

    // Initialize a position in all of the pools
    pool_list.initializer = *ctx.accounts.initializer;

    Ok(())
}


