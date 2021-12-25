use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_lang::solana_program::system_program;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

use amm::program::Amm;
use amm::cpi::accounts::CreatePosition;
use amm::cpi;

use crate::ErrorCode;
use crate::state::BondPoolAccount;
use crate::utils::functional::calculate_redeemables_to_be_distributed;

use amm::{self, Decimal, Tickmap, State, Pool, Tick, Position, PositionList};

#[derive(Accounts)]
// #[instruction(amount)]
#[instruction(
    _position_bump: u8,
    _bump_bond_pool_account: u8,
    lower_tick_index: i32,
    upper_tick_index: i32,
    liquidity_delta: u128
)]
pub struct CreateLiquidityPosition<'info> {

    #[account(signer, mut)]
    pub initializer: AccountInfo<'info>,
    // #[account(seeds = [b"statev1".as_ref()], bump = state.load()?.bump)]
    pub state: AccountLoader<'info, State>,
    #[account(mut)]
    pub position: AccountInfo<'info>,
    // #[account(mut,
    //     seeds = [b"poolv1", token_x.to_account_info().key.as_ref(), token_y.to_account_info().key.as_ref(), &pool.load()?.fee.v.to_le_bytes(), &pool.load()?.tick_spacing.to_le_bytes()],
    //     bump = pool.load()?.bump
    // )]
    pub pool: AccountLoader<'info, Pool>,
    // #[account(
    //     mut,
    //     seeds = [b"positionlistv1", owner.to_account_info().key.as_ref()],
    //     bump = position_list.load()?.bump
    // )]
    pub position_list: AccountLoader<'info, PositionList>,
    // #[account(
    //     seeds=[initializer.key.as_ref(), b"bondPoolAccount"],
    //     bump = _bump_bond_pool_account
    // )]
    pub owner: AccountInfo<'info>,
    // #[account(mut,
    //     seeds = [b"tickv1", pool.to_account_info().key.as_ref(), &lower_tick_index.to_le_bytes()],
    //     bump = lower_tick.load()?.bump
    // )]
    pub lower_tick: AccountLoader<'info, Tick>,
    // #[account(mut,
    //     seeds = [b"tickv1", pool.to_account_info().key.as_ref(), &upper_tick_index.to_le_bytes()],
    //     bump = upper_tick.load()?.bump
    // )]
    pub upper_tick: AccountLoader<'info, Tick>,
    // #[account(constraint = token_x.to_account_info().key == &pool.load()?.token_x,)]
    pub token_x: Account<'info, Mint>,
    // #[account(constraint = token_y.to_account_info().key == &pool.load()?.token_y,)]
    pub token_y: Account<'info, Mint>,
    // #[account(mut,
    //     constraint = &account_x.mint == token_x.to_account_info().key,
    //     constraint = &account_x.owner == owner.key,
    // )]
    pub account_x: Box<Account<'info, TokenAccount>>,
    // #[account(mut,
    //     constraint = &account_y.mint == token_y.to_account_info().key,
    //     constraint = &account_y.owner == owner.key
    // )]
    pub account_y: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        constraint = &reserve_x.mint == token_x.to_account_info().key,
        constraint = &reserve_x.owner == program_authority.key,
        constraint = reserve_x.to_account_info().key == &pool.load()?.token_x_reserve
    )]
    pub reserve_x: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        constraint = &reserve_y.mint == token_y.to_account_info().key,
        constraint = &reserve_y.owner == program_authority.key,
        constraint = reserve_y.to_account_info().key == &pool.load()?.token_y_reserve
    )]
    pub reserve_y: Box<Account<'info, TokenAccount>>,

    #[account(constraint = &state.load()?.authority == program_authority.key)]
    pub program_authority: AccountInfo<'info>,
    #[account(address = token::ID)]
    pub token_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    pub invariant_program: Program<'info,Amm>,





    // // Provide all pool-addresses that we will be depositing amounts to
    // pub currency_mint: Account<'info, Mint>,
    //
    // // The bond pool account
    // #[account(mut)]
    // pub bond_pool_account: Box<Account<'info, BondPoolAccount>>,
    //
    // pub bond_pool_currency_account: Account<'info, TokenAccount>,
    //
    //
    // // The standard accounts
    // pub rent: Sysvar<'info, Rent>,
    // pub clock: Sysvar<'info, Clock>,
    // pub system_program: Program<'info, System>,
    // pub token_program: Program<'info, Token>,
}

/*
    Based on the portfolio and weights, calculate how much to re-distribute into each pool
*/
// // TODO: Replace everything by decimals?
// pub fn calculate_amount_per_pool(x: u64) -> [u64; 5] {
//
//     let default_pay_in_amount: u64 = x / 5;
//
//     return [default_pay_in_amount, default_pay_in_amount, default_pay_in_amount, default_pay_in_amount, default_pay_in_amount];
// }

/**
    Deposit reserve to pools.
    All the Solana tokens that are within the reserve,
    are now put into
 */
pub fn handler(
    ctx: Context<CreateLiquidityPosition>,
    _position_bump: u8,
    _bump_bond_pool_account: u8,
    lower_tick_index: i32,
    upper_tick_index: i32,
    _liquidity_delta: u128,
) -> ProgramResult {
    msg!("Depositing reserve to pools!");

    // TODO: Create position list if it doesn't exist yet

    // TODO: Create

    let liquidity_delta: Decimal = Decimal {
        v: _liquidity_delta
    };

    // let create_position_accounts = CreatePosition {
    //     state: ctx.accounts.state.to_account_info(),
    //     position: ctx.accounts.position.to_account_info(),
    //     pool: ctx.accounts.pool.to_account_info(),
    //     position_list: ctx.accounts.position_list.to_account_info(),
    //     owner: ctx.accounts.owner.to_account_info(),
    //     lower_tick: ctx.accounts.lower_tick.to_account_info(),
    //     upper_tick: ctx.accounts.upper_tick.to_account_info(),
    //     token_x: ctx.accounts.token_x.to_account_info(),
    //     token_y: ctx.accounts.token_y.to_account_info(),
    //     account_x: ctx.accounts.account_x.to_account_info(),
    //     account_y: ctx.accounts.account_y.to_account_info(),
    //     reserve_x: ctx.accounts.reserve_x.to_account_info(),
    //     reserve_y: ctx.accounts.reserve_y.to_account_info(),
    //     program_authority: ctx.accounts.program_authority.to_account_info(),
    //     token_program: ctx.accounts.token_program.to_account_info(),
    //     rent: ctx.accounts.rent.to_account_info(),
    //     system_program: ctx.accounts.system_program.to_account_info(),
    // };
    // let invariant_program = ctx.accounts.invariant_program.to_account_info();
    //
    // amm::cpi::create_position(
    //     CpiContext::new_with_signer(
    //         invariant_program,
    //         create_position_accounts,
    //         &[
    //             [
    //                 ctx.accounts.initializer.key.as_ref(), b"bondPoolAccount",
    //                 &[_bump_bond_pool_account]
    //             ].as_ref()
    //         ]
    //     ),
    //     _position_bump,
    //     _lower_tick_index,
    //     _upper_tick_index,
    //     liquidity_delta
    // )?;


    // // Calculate how much currency is in the bond
    // let available_currency: u64 = ctx.accounts.bond_pool_currency_account.amount;
    //
    // // For now, assume we provide the same amount of liquidity to all pools
    // // So we don't have to calculate the weightings
    // let fraction_per_pool = calculate_amount_per_pool(available_currency);
    //
    // // Make swaps, and deposit this much to the pool
    // for i in 0..fraction_per_pool.len() {
    //
    // }

    Ok(())
}