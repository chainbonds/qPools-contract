//! Use docstrings as specified here: https://doc.rust-lang.org/rustdoc/how-to-write-documentation.html
mod instructions;
mod utils;
mod state;

use anchor_lang::prelude::*;
use anchor_spl::token::{Token};

use instructions::*;
// use state::*;
// use amm::{self, Decimal, Tickmap, State, Pool, Tick, Position, PositionList};

// declare_id!( Pubkey::from_str(env!("PROGRAM_ID")) );
// declare_id!( "Bqv9hG1f9e3V4w5BfQu6Sqf2Su8dH8Y7ZJcy7XyZyk4A" );
declare_id!("3vTbhuwJwR5BadSH9wt29rLf91S57x31ynQZJpG9cf7E");
// static KEY: &str = env!("PROGRAM_ID");
// declare_id!(KEY);

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

/**
    The relevant RPC endpoints from the amm program are:
    (in chronological order)

    - create_position
    - remove_position
    - claim_fee

    The RPC endpoints that are optional
    - swap
        => We can also use the frontend to do swaps over serum, or similar


    The RPC endpoints we are unsure about
    - create_fee_tier
    - create_position_list

    The RPC endpoints that we _probably_ will not need
    - transfer_position_ownership
        => probably not needed in the first MVP, could be interesting later
    - claim_fee
        => I think this will be used not from this, but separately

    The RPC endpoints that we will not use
    - create_pool
        => This is only called to create the pool, once the pool is created, no more is needed
    - create_state
        => I think this is only used when initializing the pool to define fees and admin,
            once the pool is initialized, we don't need this anymore
    - create_tick
        => this will already be created before we can use the pool,
            we have to use this before calling the pool


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

    /**
    * A simple health checkpoint which checks if the program is up and running
    */
    pub fn healthcheck(ctx: Context<Healthcheck>) -> ProgramResult {
        instructions::healthcheck::handler(ctx)
    }

    /**
    * Initializes the reserve / vault
    */
    pub fn initialize_bond_pool(
        ctx: Context<InitializeBondPool>,
        _bump_bond_pool_account: u8
    ) -> ProgramResult {

        instructions::initialize_bond_pool::handler(
            ctx,
            _bump_bond_pool_account
        )
    }

    // Should probably also include logic to remove how much you want to put into the bond...
    /**
    * Pay in some SOL into the bond that way created with initialize_bond_context.
    * amount_in_lamports is how much solana to pay in, provided in lampots (i.e. 10e-9 of 1SOL)
    */
    pub fn purchase_bond(
        ctx: Context<PurchaseBond>,
        amount_raw: u64,
    ) -> ProgramResult {

        instructions::purchase_bond::handler(ctx, amount_raw)
    }

    /**
    * Redeem the bond,
    *
    *   If it is before the bond runs out,
    +     then you should pay out part of the profits that were generated so far
    *   If it is after the bond runs out,
    *     then you should pay out all the profits, and the initial pay-in amount (face-value / par-value) that was paid in
    */
    pub fn redeem_bond(
        ctx: Context<RedeemBond>,
        redeemable_amount_raw: u64
    ) -> ProgramResult {

        instructions::redeem_bond::handler(ctx, redeemable_amount_raw)
    }

    /**
    * Register all the pools that are defined by invariant
    *
    */
    pub fn swap_pair(
        ctx: Context<SwapPairInstruction>,
        _bump_bond_pool_account: u8,
        x_to_y: bool,
        amount: u64,
        by_amount_in: bool,
        sqrt_price_limit: u128,
    ) -> ProgramResult {
        instructions::swap_pair::handler(
            ctx,
            _bump_bond_pool_account,
            x_to_y,
            amount,
            by_amount_in,
            sqrt_price_limit,
        )
    }


    /**
     * Register all the pools that are defined by invariant
     *
     */
    // Should probably import the Decimal types?
    pub fn create_liquidity_position(
        ctx: Context<CreateLiquidityPosition>,
        _position_bump: u8,
        _bump_bond_pool_account: u8,
        _lower_tick_index: i32,
        _upper_tick_index: i32,
        liquidity_delta: u128
    ) -> ProgramResult {

        // For now assume that our portfolio has an equal weight across all pools
        instructions::create_liquidity_position::handler(
            ctx,
            _position_bump,
            _bump_bond_pool_account,
            _lower_tick_index,
            _upper_tick_index,
            liquidity_delta
        )
    }

}


/**
 * Error definitions
 */
#[error]
pub enum ErrorCode {
    #[msg("Redeemables to be paid out are somehow zero!")]
    LowBondRedeemableAmount,
    #[msg("Token to be paid into the bond should not be zero")]
    LowBondTokAmount,
    #[msg("Asking for too much SOL when redeeming!")]
    RedeemCapacity,
    #[msg("Need to send more than 0 SOL!")]
    MinPurchaseAmount,
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
