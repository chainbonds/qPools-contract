use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::{BondPoolAccount, InvariantPoolList};

// Right now, we assume that we can have up to 10 pools

#[derive(Accounts)]
#[instruction(
    _bump_pool_list: u8,
    weights: [u64; 10]
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
    pub pool_list_address_0: AccountInfo<'info>,
    pub pool_list_address_1: AccountInfo<'info>,
    pub pool_list_address_2: AccountInfo<'info>,
    pub pool_list_address_3: AccountInfo<'info>,
    pub pool_list_address_4: AccountInfo<'info>,
    pub pool_list_address_5: AccountInfo<'info>,
    pub pool_list_address_6: AccountInfo<'info>,
    pub pool_list_address_7: AccountInfo<'info>,
    pub pool_list_address_8: AccountInfo<'info>,
    pub pool_list_address_9: AccountInfo<'info>,

    #[account(signer, mut)]
    pub initializer: AccountInfo<'info>,

    // The standards accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<RegisterInvariantPools>,
    _bump_pool_list: u8,
    weights: [u64; 10]
) -> ProgramResult {

    /*
        As Input, have a list of Pool Accounts
     */

    let pool_list = &mut ctx.accounts.pool_list;

    // Iterate through the pools
    pool_list.pool_addresses[0] = ctx.accounts.pool_list_address_0.key();
    pool_list.pool_addresses[1] = ctx.accounts.pool_list_address_1.key();
    pool_list.pool_addresses[2] = ctx.accounts.pool_list_address_2.key();
    pool_list.pool_addresses[3] = ctx.accounts.pool_list_address_3.key();
    pool_list.pool_addresses[4] = ctx.accounts.pool_list_address_4.key();
    pool_list.pool_addresses[5] = ctx.accounts.pool_list_address_5.key();
    pool_list.pool_addresses[6] = ctx.accounts.pool_list_address_6.key();
    pool_list.pool_addresses[7] = ctx.accounts.pool_list_address_7.key();
    pool_list.pool_addresses[8] = ctx.accounts.pool_list_address_8.key();
    pool_list.pool_addresses[9] = ctx.accounts.pool_list_address_9.key();

    // Initialize a position in all of the pools
    pool_list.initializer = ctx.accounts.initializer.key();

    Ok(())
}


