
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::{BondPoolAccount, TvlInfoAccount};
use crate::utils::seeds;

#[derive(Accounts)]
#[instruction(
    _bump_bond_pool_account: u8,
    _bump_tvl_account: u8
)]
pub struct InitializeBondPool<'info> {

    // The account which represents the bond pool account
    #[account(
        init,
        payer = initializer,
        space = BondPoolAccount::LEN,
        seeds = [bond_pool_currency_token_mint.key().as_ref(), seeds::BOND_POOL_ACCOUNT], bump = _bump_bond_pool_account
    )]
    pub bond_pool_account: Box<Account<'info, BondPoolAccount>>,

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

    #[account(
        init,
        payer = initializer,
        space = 8 + 64,
        seeds = [bond_pool_account.key().as_ref(), seeds::TVL_INFO_ACCOUNT],
        bump = _bump_tvl_account
    )]
    pub tvl_account: Account<'info, TvlInfoAccount>,

    // The standards accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<InitializeBondPool>,
    _bump_bond_pool_account: u8,
    _bump_tvl_account: u8
) -> ProgramResult {

    let bond_account = &mut ctx.accounts.bond_pool_account;
    bond_account.generator = ctx.accounts.initializer.key();
    bond_account.bond_pool_redeemable_mint = ctx.accounts.bond_pool_redeemable_mint.key();
    bond_account.bond_pool_currency_token_mint = ctx.accounts.bond_pool_currency_token_mint.key();
    bond_account.bond_pool_redeemable_token_account = ctx.accounts.bond_pool_redeemable_token_account.key();
    bond_account.bond_pool_currency_token_account = ctx.accounts.bond_pool_currency_token_account.key();
    bond_account.bump_bond_pool_account = _bump_bond_pool_account;

    // // The also set the TVL Account to 0., because right now nothing is in the pool
    // let tvl_account = &mut ctx.accounts.tvl_account;
    // tvl_account.tvl_in_usdc = 0;

    Ok(())
}