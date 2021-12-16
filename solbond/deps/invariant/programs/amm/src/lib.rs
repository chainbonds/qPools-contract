pub mod decimal;
pub mod errors;
pub mod instructions;
pub mod interfaces;
pub mod math;
pub mod structs;
pub mod uint;
pub mod util;

use anchor_lang::prelude::*;
use anchor_spl::token;

use decimal::*;
use errors::ErrorCode;
use errors::*;
use instructions::*;
use math::*;
//use structs::State;
pub use structs::*;
use util::*;


use instructions::claim_fee::ClaimFee;

// declare_id!("3f2yCuof5e1MpAC8RNgWVnQuSHpDjUHPGds6jQ1tRphY");
declare_id!("GpvoxwEz4AEPnWqhmD9DTfSQwUp3oQ5up71cWGVn2HsC");
const SEED: &str = "Invariant";

#[program]
pub mod amm {
    use super::*;

    pub fn create_state(
        ctx: Context<CreateState>,
        bump: u8,
        protocol_fee: Decimal,
    ) -> ProgramResult {
        instructions::create_state::handler(ctx, bump, protocol_fee)
    }
    //#[access_control(admin(&ctx.accounts.state, &ctx.accounts.payer))]
    pub fn create_fee_tier(
        ctx: Context<CreateFeeTier>,
        bump: u8,
        fee: u64,
        tick_spacing: u16,
    ) -> ProgramResult {
        instructions::create_fee_tier::handler(ctx, bump, fee, tick_spacing)
    }

    pub fn create_pool(
        ctx: Context<CreatePool>,
        bump: u8,
        nonce: u8,
        init_tick: i32,
        _fee: u64,
        _tick_spacing: u16,
    ) -> ProgramResult {
        instructions::create_pool::handler(ctx, bump, nonce, init_tick, _fee, _tick_spacing)
    }

    pub fn swap(
        ctx: Context<Swap>,
        _fee_tier_address: Pubkey,
        x_to_y: bool,
        amount: u64,
        by_amount_in: bool, // whether amount specifies input or output
        sqrt_price_limit: u128,
    ) -> ProgramResult {
        instructions::swap::handler(
            ctx,
            _fee_tier_address,
            x_to_y,
            amount,
            by_amount_in,
            sqrt_price_limit,
        )
    }

    pub fn create_tick(
        ctx: Context<CreateTick>,
        bump: u8,
        _fee_tier_address: Pubkey,
        index: i32,
    ) -> ProgramResult {
        instructions::create_tick::handler(ctx, bump, _fee_tier_address, index)
    }

    pub fn create_position_list(ctx: Context<CreatePositionList>, bump: u8) -> ProgramResult {
        instructions::create_position_list::handler(ctx, bump)
    }

    pub fn create_position(
        ctx: Context<CreatePosition>,
        bump: u8,
        _fee_tier_address: Pubkey,
        _lower_tick_index: i32,
        _upper_tick_index: i32,
        liquidity_delta: Decimal,
    ) -> ProgramResult {
        instructions::create_position::handler(
            ctx,
            bump,
            _fee_tier_address,
            _lower_tick_index,
            _upper_tick_index,
            liquidity_delta,
        )
    }

    pub fn remove_position(
        ctx: Context<RemovePosition>,
        _fee_tier_address: Pubkey,
        index: u32,
        lower_tick_index: i32,
        upper_tick_index: i32,
    ) -> ProgramResult {
        instructions::remove_position::handler(
            ctx,
            _fee_tier_address,
            index,
            lower_tick_index,
            upper_tick_index,
        )
    }

    pub fn transfer_position_ownership(
        ctx: Context<TransferPositionOwnership>,
        bump: u8,
        index: u32,
    ) -> ProgramResult {
        instructions::transfer_position_ownership::handler(ctx, bump, index)
    }

    pub fn claim_fee(
        ctx: Context<ClaimFee>,
        fee_tier_address: Pubkey,
        index: u32,
        lower_tick_index: i32,
        upper_tick_index: i32,
    ) -> ProgramResult {
        instructions::claim_fee::handler(
            ctx,
            fee_tier_address,
            index,
            lower_tick_index,
            upper_tick_index,
        )
    }

    pub fn update_seconds_per_liquidity(
        ctx: Context<UpdateSecondsPerLiquitity>,
        fee_tier_address: Pubkey,
        lower_tick_index: i32,
        upper_tick_index: i32,
        index: i32,
    ) -> ProgramResult {
        instructions::update_seconds_per_liquidity::handler(
            ctx,
            fee_tier_address,
            lower_tick_index,
            upper_tick_index,
            index,
        )
    }

    #[access_control(admin(&ctx.accounts.state, &ctx.accounts.admin))]
    pub fn withdraw_protocol_fee(ctx: Context<WithdrawProtocolFee>) -> ProgramResult {
        instructions::withdraw_protocol_fee::handler(ctx, SEED)
    }
}

fn admin(state_loader: &AccountLoader<State>, signer: &AccountInfo) -> Result<()> {
    let state = state_loader.load()?;
    require!(signer.key.eq(&state.admin), Unauthorized);
    Ok(())
}
