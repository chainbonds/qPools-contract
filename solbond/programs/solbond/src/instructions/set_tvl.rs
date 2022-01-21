use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};
use crate::state::TvlInfoAccount;

#[derive(Accounts)]
#[instruction(
    new_tvl_in_usd: u64,
    tvl_account_bump: u8
)]
pub struct SetTvl<'info> {
    #[account(
        init,
        payer = initializer,
        space = 64,
        seeds = [pool_account.key().as_ref(), b"tvlInfoAccount1"],
        bump = tvl_account_bump
    )]
    pub tvl_account: Account<'info, TvlInfoAccount>,
    #[account(signer, mut)]
    pub initializer: AccountInfo<'info>,
    pub pool_account: AccountInfo<'info>,

    // The standards accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<SetTvl>,
    new_tvl_in_usd: u64,
    tvl_account_bump: u8
) -> ProgramResult {

    let tvl_account = &mut ctx.accounts.tvl_account;
    if new_tvl_in_usd > 0 {
        tvl_account.tvl_in_usdc = new_tvl_in_usd;
    }

    Ok(())
}

