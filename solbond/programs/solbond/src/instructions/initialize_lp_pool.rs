
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::{TwoWayPoolAccount};
use crate::utils::seeds;

#[derive(Accounts)]
#[instruction(
    _bump: u8,
)]
pub struct InitializeLpPoolAccount<'info> {

    #[account(
        init_if_needed,
        payer = initializer,
        space = TwoWayPoolAccount::LEN,
        seeds = [mint_lp.key().as_ref(), seeds::TWO_WAY_LP_POOL], bump = _bump
    )]
    pub pool_pda: Box<Account<'info, TwoWayPoolAccount>>,


    #[account(mut)]
    pub mint_lp: Account<'info, Mint>,
    #[account(mut)]
    pub mint_a: Account<'info, Mint>,
    #[account(mut)]
    pub mint_b: Account<'info, Mint>,

    #[account(mut)]
    pub pool_token_account_a: Account<'info, TokenAccount>,

    #[account(mut)]
    pub pool_token_account_b: Account<'info, TokenAccount>,

    #[account(mut)]
    pub initializer: Signer<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<InitializeLpPoolAccount>,
    _bump: u8,
) -> ProgramResult {
    msg!("initializing pool");
    let pool_account = &mut ctx.accounts.pool_pda;

    pool_account.generator = ctx.accounts.initializer.key();

    pool_account.mint_a = ctx.accounts.mint_a.key();

    pool_account.mint_b = ctx.accounts.mint_b.key();

    pool_account.mint_lp = ctx.accounts.mint_lp.key();
   
    pool_account.pool_token_account_a = ctx.accounts.pool_token_account_a.key();

    pool_account.pool_token_account_b = ctx.accounts.pool_token_account_b.key();

    pool_account.bump = _bump;

    pool_account.total_amount_in_a = 0;

    pool_account.total_amount_in_b = 0;

    Ok(())
}