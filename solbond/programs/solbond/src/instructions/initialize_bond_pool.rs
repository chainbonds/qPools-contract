
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::BondPoolAccount;

#[derive(Accounts)]
#[instruction(
    _bump_bond_pool_account: u8
)]
pub struct InitializeBondPool<'info> {

    // The account which represents the bond pool account
    #[account(
        init,
        payer = initializer,
        space = 8 + BondPoolAccount::LEN,
        seeds = [initializer.key.as_ref(), b"bondPoolAccount"], bump = _bump_bond_pool_account
    )]
    pub bond_pool_account: Account<'info, BondPoolAccount>,

    // #[account(
    //     init,
    //     payer = initializer,
    //     mint::decimals = DECIMALS,
    //     mint::authority = bond_pool_account,
    //     constraint = bond_pool_redeemable_mint.mint_authority == COption::Some(bond_pool_account.key()),
    //     constraint = bond_pool_redeemable_mint.supply == 0
    // )]
    #[account(
        constraint = bond_pool_redeemable_mint.mint_authority == COption::Some(bond_pool_account.key()),
        constraint = bond_pool_redeemable_mint.supply == 0
    )]
    pub bond_pool_redeemable_mint: Account<'info, Mint>,
    #[account(mut)]
    pub bond_pool_currency_token_mint: Account<'info, Mint>,

    #[account(mut, constraint = bond_pool_redeemable_token_account.owner == bond_pool_account.key())]
    pub bond_pool_redeemable_token_account: Account<'info, TokenAccount>,
    // You could also keep this, but then you have to turn this into a PDA
    // #[account(init, payer = initializer, token::mint = bond_pool_token_mint, token::authority = bond_pool_account)]
    // I think this is easier for now, can add constraint checks later
    #[account(mut, constraint = bond_pool_currency_token_account.owner == bond_pool_account.key())]
    pub bond_pool_currency_token_account: Account<'info, TokenAccount>,

    // The account which generate the bond pool
    #[account(signer, mut)]
    pub initializer: AccountInfo<'info>,

    // The standards accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<InitializeBondPool>,
    _bump_bond_pool_account: u8
) -> ProgramResult {

    let bond_account = &mut ctx.accounts.bond_pool_account;
    bond_account.generator = ctx.accounts.initializer.key();
    bond_account.bond_pool_redeemable_mint = ctx.accounts.bond_pool_redeemable_mint.key();
    bond_account.bond_pool_currency_token_mint = ctx.accounts.bond_pool_currency_token_mint.key();
    bond_account.bond_pool_redeemable_token_account = ctx.accounts.bond_pool_redeemable_token_account.key();
    bond_account.bond_pool_currency_token_account = ctx.accounts.bond_pool_currency_token_account.key();
    bond_account.bump_bond_pool_account = _bump_bond_pool_account;

    Ok(())
}