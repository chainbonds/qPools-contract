use solana_program::program::{invoke, invoke_signed};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_lang::solana_program::native_token::{lamports_to_sol, sol_to_lamports};
use anchor_spl::token::{self, Burn, Mint, TokenAccount, Token, MintTo};

use crate::{
    ErrorCode,
    BondInstanceAccount,
    BondPoolAccount,
    InitializeBondInstance
};

pub fn initialize_bond_instance_logic(
    ctx: Context<InitializeBondInstance>,
    start_time: u64,
    end_time: u64,
    _bump_bond_instance_account: u8,
    _bump_bond_instance_solana_account: u8,
) -> ProgramResult {

    if start_time >= end_time {
        return Err(ErrorCode::TimeFrameIsNotAnInterval.into());
    }
    msg!("Current timestamp is: {}", ctx.accounts.clock.unix_timestamp);
    if (ctx.accounts.clock.unix_timestamp as u64) >= start_time {
        return Err(ErrorCode::TimeFrameIsInThePast.into());
    }

    let bond_instance_account = &mut ctx.accounts.bond_instance_account;

    // Accounts for the initializer
    bond_instance_account.purchaser = ctx.accounts.purchaser.key();
    bond_instance_account.purchaser_token_account = ctx.accounts.purchaser_token_account.key();

    // Currently these accounts are generated in the frontend, we should probably generate these here ...
    // Accounts for the bond
    bond_instance_account.bond_pool_account = ctx.accounts.bond_pool_account.key();
    bond_instance_account.bond_instance_solana_account = ctx.accounts.bond_instance_solana_account.key();
    bond_instance_account.bond_instance_token_account = ctx.accounts.bond_instance_token_account.key();

    // Amount is probably not needed, because we track everything with tokens ...!
    bond_instance_account.start_time = start_time;
    bond_instance_account.end_time = end_time;

    // This value will be incremented when adding more to the bond treasury
    bond_instance_account.initial_payin_amount_in_lamports = 0;
    bond_instance_account.last_profit_payout = start_time;

    // Include also any bumps, etc.
    bond_instance_account.bump_bond_instance_account = _bump_bond_instance_account;
    bond_instance_account.bump_bond_instance_solana_account = _bump_bond_instance_solana_account;

    Ok(())
}