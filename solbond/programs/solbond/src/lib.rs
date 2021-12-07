//! Use docstrings as specified here: https://doc.rust-lang.org/rustdoc/how-to-write-documentation.html
mod instructions;
mod utils;

use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{Mint, TokenAccount, Token};

use instructions::redeem_bond::redeem_bond_instance_logic;
use instructions::purchase_bond::purchase_bond_instance_logic;
use instructions::initialize_bond_pool::initialize_bond_pool_logic;
use instructions::initialize_bond_instance::initialize_bond_instance_logic;

// const DECIMALS: u8 = 1;

declare_id!("Bqv9hG1f9e3V4w5BfQu6Sqf2Su8dH8Y7ZJcy7XyZyk4A");

// TODO: Replace all lamports with how many solana actually should be paid off.

/*
    TODO: 1
    We should probably have a separate function to do the portfolio (re-)distribution
    Buy mSOL, track total supply with redeemable-tokens ...

    TODO: 2
    Figure out a way to calculate the final bond, as well as the stepwise points
    you can probably use a simple formula
    and keep track of the amount that was already paid in
    You can save these variables as part of the state

    TODO: 3
    Have a bunch of constraints across bondAccount

    TODO: 4
    Have another function to pay out profits ...
    I guess this is also where our own profit-account comes in ...

    TODO: 5
    Include epochs (potentially), to decide how often something can be paid out as well.
*/

#[derive(Accounts)]
#[instruction(
_bump_bond_pool_account: u8,
_bump_bond_pool_solana_account: u8
)]
pub struct BalancePools<'info> {

    // The standards accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[program]
pub mod solbond {
    use super::*;

    pub fn example_reserve_solana_to_liquidity_pools(
        ctx: Context<BalancePools>,
        solana_in_lamports: u8,
    ) -> ProgramResult {

        /*
            (Step 1: Transfer from user to reserve)
        */

        /*
            (Step 2: Transfer from us to user)
        */

        Ok(())

    }

    pub fn initialize_bond_pool(
        ctx: Context<InitializeBondPool>,
        _bump_bond_pool_account: u8,
        _bump_bond_pool_solana_account: u8,
    ) -> ProgramResult {

        initialize_bond_pool_logic(
            ctx,
            _bump_bond_pool_account,
            _bump_bond_pool_solana_account,
        )
    }

    /**
    *  We need to make two separate functions,
        one to create the bond,
        and one to make the "pay-in, redeem-token" transaction
        otherwise, the program just keeps growing, which is a problem

    */
    pub fn initialize_bond_instance(
        ctx: Context<InitializeBondInstance>,
        _bump_bond_instance_account: u8,
        _bump_bond_instance_solana_account: u8,
    ) -> ProgramResult {

        initialize_bond_instance_logic(
            ctx,
            _bump_bond_instance_account,
            _bump_bond_instance_solana_account
        )
    }

    // Should probably also include logic to remove how much you want to put into the bond...
    /**
    * Pay in some SOL into the bond that way created with initialize_bond_context.
    * amount_in_lamports is how much solana to pay in, provided in lampots (i.e. 10e-9 of 1SOL)
    */
    pub fn purchase_bond_instance(
        ctx: Context<PurchaseBondInstance>,
        amount_in_lamports: u64,
    ) -> ProgramResult {

        purchase_bond_instance_logic(ctx, amount_in_lamports)
    }

    /**
    * Redeem the bond,
    *
    *   If it is before the bond runs out,
    +     then you should pay out part of the profits that were generated so far
    *   If it is after the bond runs out,
    *     then you should pay out all the profits, and the initial pay-in amount (face-value / par-value) that was paid in
    */
    pub fn redeem_bond_instance(
        ctx: Context<RedeemBondInstance>,
        redeemable_amount_in_lamports: u64
    ) -> ProgramResult {

        redeem_bond_instance_logic(ctx, redeemable_amount_in_lamports)
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

#[derive(Accounts)]
#[instruction(
    amount_in_lamports: u64,
)]
pub struct PurchaseBondInstance<'info> {

    // All Bond Pool Accounts
    #[account(mut)]
    pub bond_pool_account: Account<'info, BondPoolAccount>,
    // Checking for seeds here is probably overkill honestly... right?
    // seeds = [bond_pool_account.key().as_ref(), b"bondPoolSolanaAccount"], bump = _bump_bond_pool_solana_accounz
    #[account(
        mut,
        constraint = bond_pool_redeemable_mint.mint_authority == COption::Some(bond_pool_account.key())
    )]
    pub bond_pool_redeemable_mint: Account<'info, Mint>,
    #[account(mut)]
    pub bond_pool_solana_account: AccountInfo<'info>,

    // All Purchaser Accounts
    #[account(signer, mut)]
    pub purchaser: AccountInfo<'info>,  // TODO: Make him signer
    // // #[account(mut)]
    // #[account(mut, constraint = purchaser_token_account.owner == purchaser.key())]
    // pub purchaser_token_account: Account<'info, TokenAccount>,
    //
    // // Any bond-instance specific accounts
    // // Assume this is the bond instance account, which represents the bond which is "purchased"
    // TODO: Also include the seeds and bump!

    // All bond instance accounts
    pub bond_instance_account: Account<'info, BondInstanceAccount>,
    // constraint = bond_instance_token_account.owner == bond_instance_account.key()
    #[account(mut)]
    pub bond_instance_token_account: Account<'info, TokenAccount>,

    // #[account(
    //     seeds = [bond_instance_account.key().as_ref(), b"bondInstanceSolanaAccount"], bump = _bump_bond_instance_solana_account
    // )]
    // pub bond_instance_solana_account: AccountInfo<'info>,

    // The standard accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}


#[derive(Accounts)]
#[instruction(
    reedemable_amount_in_lamports: u64,
)]
pub struct RedeemBondInstance<'info> {

    // Any Bond Pool Accounts
    #[account(mut)]
    pub bond_pool_account: Box<Account<'info, BondPoolAccount>>,
    #[account(
        mut,
        constraint = bond_pool_redeemable_mint.mint_authority == COption::Some(bond_pool_account.key())
    )]
    pub bond_pool_redeemable_mint: Account<'info, Mint>,
    #[account(mut)]
    pub bond_pool_solana_account: AccountInfo<'info>,

    // And Bond Instance Accounts
    pub bond_instance_account: Account<'info, BondInstanceAccount>,
    #[account(mut)]
    pub bond_instance_token_account: Account<'info, TokenAccount>,

    #[account(signer, mut)]
    pub purchaser: AccountInfo<'info>,  // TODO: Make him signer
    #[account(mut, constraint = purchaser_token_account.owner == purchaser.key())]
    pub purchaser_token_account: Account<'info, TokenAccount>,

    // The standard accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

/**
* State
*/
#[account]
pub struct BondPoolAccount {
    pub generator: Pubkey,

    pub bond_pool_redeemable_mint: Pubkey,
    pub bond_pool_redeemable_token_account: Pubkey,
    pub bond_pool_solana_account: Pubkey,

    // Include also any bumps, etc.
    pub bump_bond_pool_account: u8,
    pub bump_bond_pool_solana_account: u8,
}

#[account]
pub struct BondInstanceAccount {

    // Accounts for the initializer
    pub purchaser: Pubkey,
    pub purchaser_token_account: Pubkey,

    // Accounts for the "parenting" bond pool
    pub bond_pool_account: Pubkey,

    // Accounts for the bond instance
    pub bond_instance_solana_account: Pubkey,
    pub bond_instance_token_account: Pubkey,

    // Include also any bumps, etc.
    pub bump_bond_instance_account: u8,
    pub bump_bond_pool_account: u8,
    pub bump_bond_instance_solana_account: u8,
}


/**
 * Error definitions
 */
#[error]
pub enum ErrorCode {
    #[msg("Redeemables to be paid out are somehow zero!")]
    LowBondRedeemableAmount,
    #[msg("SOL to be paid into the bond should not be zero")]
    LowBondSolAmount,
    #[msg("Asking for too much SOL when redeeming!")]
    RedeemCapacity,
    #[msg("Provided times are not an interval (end-time before start-time!)")]
    TimeFrameIsNotAnInterval,
    #[msg("Provided starting time is not in the future. You should make it in such a way that it is slightly in the future, s.t. you have the ability to pay in some amounts.")]
    TimeFrameIsInThePast,
    #[msg("Bond is already locked, you cannot pay in more into this bond!")]
    TimeFrameCannotPurchaseAdditionalBondAmount,
    #[msg("Bond has not gone past timeframe yet")]
    TimeFrameNotPassed,
    #[msg("There was an issue computing the market rate. MarketRateOverflow")]
    MarketRateOverflow,
    #[msg("There was an issue computing the market rate. MarketRateUnderflow")]
    MarketRateUnderflow,
    #[msg("Paying out more than was initially paid in")]
    PayoutError,
    #[msg("Redeemable-calculation doesnt add up")]
    Calculation,
}
