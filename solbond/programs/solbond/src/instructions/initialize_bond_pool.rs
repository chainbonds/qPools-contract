
use anchor_lang::prelude::*;

use crate::{
    InitializeBondPool
};

pub fn initialize_bond_pool_logic(
    ctx: Context<InitializeBondPool>,
    _bump_bond_pool_account: u8,
    _bump_bond_pool_token_account: u8
) -> ProgramResult {

    let bond_account = &mut ctx.accounts.bond_pool_account;
    bond_account.generator = ctx.accounts.initializer.key();
    bond_account.bond_pool_redeemable_mint = ctx.accounts.bond_pool_redeemable_mint.key();
    bond_account.bond_pool_token_mint = ctx.accounts.bond_pool_token_mint.key();
    bond_account.bond_pool_redeemable_token_account = ctx.accounts.bond_pool_redeemable_token_account.key();
    bond_account.bond_pool_token_account = ctx.accounts.bond_pool_token_account.key();
    bond_account.bump_bond_pool_account = _bump_bond_pool_account;
    bond_account.bump_bond_pool_token_account = _bump_bond_pool_token_account;

    Ok(())
}