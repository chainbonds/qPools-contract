use anchor_lang::prelude::*;

use crate::{
    InitializeBondInstance
};

#[derive(Accounts)]
#[instruction(
_bump_bond_instance_account: u8,
_bump_bond_instance_solana_account: u8,
)]
pub struct InitializeBondInstance<'info> {

    #[account(mut)]
    pub bond_pool_account: Account<'info, BondPoolAccount>,

    // Assume this is the purchaser, who goes into a contract with himself
    #[account(signer, mut)]
    pub purchaser: AccountInfo<'info>,
    // #[account(mut)]
    #[account(mut, constraint = purchaser_token_account.owner == purchaser.key())]
    pub purchaser_token_account: Account<'info, TokenAccount>,

    // Any bond-instance specific accounts
    // Assume this is the bond instance account, which represents the bond which is "purchased"
    #[account(
    init,
    payer = purchaser,
    space = 64 + 64 + 64 + 64 + 64 + 64 + 64 + 64 + 64 + 64 + 8 + 8 + 8,
    seeds = [purchaser.key.as_ref(), b"bondInstanceAccount"],
    bump = {msg!("bump be {}", _bump_bond_instance_account); _bump_bond_instance_account}
    )]
    pub bond_instance_account: Account<'info, BondInstanceAccount>,
    #[account(mut, constraint = bond_instance_token_account.owner == bond_instance_account.key())]
    pub bond_instance_token_account: Account<'info, TokenAccount>,
    #[account(
    seeds = [bond_instance_account.key().as_ref(), b"bondInstanceSolanaAccount"], bump = _bump_bond_instance_solana_account
    )]
    pub bond_instance_solana_account: AccountInfo<'info>,

    // The standard accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,

}

pub fn handle(
    ctx: Context<InitializeBondInstance>,
    _bump_bond_instance_account: u8,
    _bump_bond_instance_solana_account: u8,
) -> ProgramResult {

    let bond_instance_account = &mut ctx.accounts.bond_instance_account;

    // Accounts for the initializer
    bond_instance_account.purchaser = ctx.accounts.purchaser.key();
    bond_instance_account.purchaser_token_account = ctx.accounts.purchaser_token_account.key();

    // Currently these accounts are generated in the frontend, we should probably generate these here ...
    // Accounts for the bond
    bond_instance_account.bond_pool_account = ctx.accounts.bond_pool_account.key();
    bond_instance_account.bond_instance_solana_account = ctx.accounts.bond_instance_solana_account.key();
    bond_instance_account.bond_instance_token_account = ctx.accounts.bond_instance_token_account.key();

    // Include also any bumps, etc.
    bond_instance_account.bump_bond_instance_account = _bump_bond_instance_account;
    bond_instance_account.bump_bond_instance_solana_account = _bump_bond_instance_solana_account;

    Ok(())
}