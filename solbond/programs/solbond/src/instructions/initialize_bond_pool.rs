use anchor_lang::prelude::*;

use crate::{
    InitializeBondPool
};

#[derive(Accounts)]
#[instruction(
_bump_bond_pool_account: u8,
_bump_bond_pool_solana_account: u8
)]
pub struct InitializeBondPool<'info> {

    // The account which represents the bond pool account
    #[account(
    init,
    payer = initializer,
    space = 8 + 64 + 64 + 64 + 64,
    seeds = [initializer.key.as_ref(), b"bondPoolAccount"], bump = _bump_bond_pool_account
    )]
    pub bond_pool_account: Account<'info, BondPoolAccount>,
    #[account(
    seeds = [bond_pool_account.key().as_ref(), b"bondPoolSolanaAccount"], bump = _bump_bond_pool_solana_account
    )]
    pub bond_pool_solana_account: AccountInfo<'info>,
    #[account(
    constraint = bond_pool_redeemable_mint.mint_authority == COption::Some(bond_pool_account.key()),
    constraint = bond_pool_redeemable_mint.supply == 0
    )]
    pub bond_pool_redeemable_mint: Account<'info, Mint>,
    #[account(mut, constraint = bond_pool_redeemable_token_account.owner == bond_pool_account.key())]
    pub bond_pool_redeemable_token_account: Account<'info, TokenAccount>,

    // The account which generate the bond pool
    #[account(signer)]
    pub initializer: AccountInfo<'info>,

    // The standards accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handle(
    ctx: Context<InitializeBondPool>,
    _bump_bond_pool_account: u8,
    _bump_bond_pool_solana_account: u8
) -> ProgramResult {

    let bond_account = &mut ctx.accounts.bond_pool_account;
    bond_account.generator = ctx.accounts.initializer.key();
    bond_account.bond_pool_redeemable_mint = ctx.accounts.bond_pool_redeemable_mint.key();
    bond_account.bond_pool_redeemable_token_account = ctx.accounts.bond_pool_redeemable_token_account.key();
    bond_account.bond_pool_solana_account = ctx.accounts.bond_pool_solana_account.key();
    bond_account.bump_bond_pool_account = _bump_bond_pool_account;
    bond_account.bump_bond_pool_solana_account = _bump_bond_pool_solana_account;

    Ok(())
}