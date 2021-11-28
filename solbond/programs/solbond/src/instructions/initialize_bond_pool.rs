use solana_program::program::{invoke, invoke_signed};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_lang::solana_program::native_token::{lamports_to_sol, sol_to_lamports};
use anchor_spl::token::{self, Burn, Mint, TokenAccount, Token, MintTo};

use crate::{
    ErrorCode,
    BondInstanceAccount,
    BondPoolAccount,
    InitializeBondPool
};

pub fn initialize_bond_pool_logic(
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