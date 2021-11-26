//! Use docstrings as specified here: https://doc.rust-lang.org/rustdoc/how-to-write-documentation.html
use solana_program::program::invoke;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, TokenAccount, Token, MintTo};

const DECIMALS: u8 = 1;

declare_id!("Bqv9hG1f9e3V4w5BfQu6Sqf2Su8dH8Y7ZJcy7XyZyk4A");

#[program]
pub mod solbond {
    use super::*;

    // Has to create a Keypair
    pub fn initialize_bond_pool(
        ctx: Context<InitializeBondPool>,
        _bump_bond_pool_account: u8,
        _bump_bond_pool_solana_account: u8,
    ) -> ProgramResult {

        // Generate the following

        // tokenMint
        // bondPoolTokenAccount
        // bondPoolSolanaAccount
        Ok(())
    }

}

/**
 * Contexts
 */

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
        space = 8 + 64 + 64 + 64,
        seeds = [initializer.key.as_ref()], bump = _bump_bond_pool_account
    )]
    pub bond_pool_account: Account<'info, BondPoolAccount>,
    #[account(
        seeds = [bond_pool_account.key().as_ref()], bump = _bump_bond_pool_solana_account
    )]
    pub bond_pool_solana_account: AccountInfo<'info>,
    pub bond_pool_redeemable_mint: Account<'info, Mint>,
    pub bond_pool_redeemable_token_account: Account<'info, TokenAccount>,

    // The account which generate the bond pool
    pub initializer: AccountInfo<'info>,  // TODO: Make him signer


    // The standards accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

// #[derive(Accounts)]
// pub struct PurchaseBond<'info> {
//
//     // Assume this is the purchaser, who goes into a contract with himself
//     pub purchaser: AccountInfo<'info>,  // TODO: Make him signer
//     pub purchaser_token_account: Account<'info, TokenAccount>,
//
//     // Assume this is the bond instance account, which represents the bond which is "purchased"
//     #[account(init, payer = purchaser, space = 8 + BondAccount::LEN)]
//     pub bond_instance_account: Account<'info, BondInstanceAccount>,
//
//     // The standard accounts
//     pub rent: Sysvar<'info, Rent>,
//     pub clock: Sysvar<'info, Clock>,
//     pub system_program: Program<'info, System>,
//     pub token_program: Program<'info, Token>,
// }
//
// #[derive(Accounts)]
// pub struct RedeemBond<'info> {
//     pub bond_instance_account: Account<'info, BondInstanceAccount>,
//
//     // The standard accounts
//     pub rent: Sysvar<'info, Rent>,
//     pub clock: Sysvar<'info, Clock>,
//     pub system_program: Program<'info, System>,
//     pub token_program: Program<'info, Token>,
// }

/**
* State
*/
#[account]
pub struct BondPoolAccount {
    pub bond_pool_token_mint: Pubkey,
    pub bond_pool_token_account: Pubkey,
    pub bond_pool_solana_account: Pubkey,

    // Include also any bumps, etc.
    pub _bump_bond_pool_account: u8,
}
//
// #[account]
// pub struct BondInstanceAccount {
//
//     // Accounts for the initializer
//     pub purchaser: Pubkey,
//     pub purchaser_token_account: Pubkey,
//
//     // Accounts for the bond
//     pub bond_solana_account: Pubkey,
//     pub bond_token_account: Pubkey,
//
//     // Amount is probably not needed, because we track everything with tokens ...!
//     pub amount: u64,
//     pub start_time: u64,
//     pub end_time: u64
//
//     // Include also any bumps, etc.
// }


/**
 * Input Accounts
 */
// #[account]
// impl BondAccount {
//     pub const LEN: usize = 32   // initializer_key
//         + 32   // initializer_token_account
//         + 32   // initializer_solana_account
//         + 32   // bond solana account
//         + 32   // redeemable_mint
//         + 64   // amount
//         + 64   // time_frame
//         + 8 // bump_bond_solana_account
//         + 8 // bump_bond_authority
//         + 8 // bump_bond_account
//     ;
// }


/**
 * Error definitions
 */
#[error]
pub enum ErrorCode {
    #[msg("SOL to be paid into the bond should not be zero")]
    LowBondSolAmount,
    #[msg("Asking for too much SOL when redeeming!")]
    RedeemCapacity,
    #[msg("Bond has not gone past timeframe yet")]
    TimeFrameNotPassed,
}
