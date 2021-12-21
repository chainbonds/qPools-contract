use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::{BondPoolAccount, InvariantPoolAccount};
use amm::cpi::accounts::Swap;
use amm::program::Amm;
use amm::{self, Tickmap, State, Pool, Tick, Position, PositionList};

#[derive(Accounts)]
// #[instruction(fee_tier_address: Pubkey)]
pub struct SwapPairInstruction<'info> {

    #[account(signer)]
    pub initializer: AccountInfo<'info>,

    pub pool: AccountLoader<'info, Pool>,
    pub state: AccountLoader<'info, State>,
    pub tickmap: AccountLoader<'info, Tickmap>,

    pub token_x_mint: Account<'info, Mint>,
    pub token_y_mint: Account<'info, Mint>,

    #[account(mut,
    constraint = &reserve_account_x.mint == token_x_mint.to_account_info().key
    )]
    pub reserve_account_x: Account<'info, TokenAccount>,
    #[account(mut,
    constraint = &reserve_account_y.mint == token_y_mint.to_account_info().key
    )]
    pub reserve_account_y: Account<'info, TokenAccount>,
    #[account(mut,
    constraint = &account_x.mint == token_x_mint.to_account_info().key
    )]
    pub account_x: Box<Account<'info, TokenAccount>>,
    #[account(mut,
    constraint = &account_y.mint == token_y_mint.to_account_info().key
    )]
    pub account_y: Box<Account<'info, TokenAccount>>,

    pub program_authority: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,

    pub invariant_program: Program<'info, Amm>,
    pub system_program: AccountInfo<'info>,
}


pub fn handler(
    ctx: Context<SwapPairInstruction>,
    x_to_y: bool,
    amount: u64,
    by_amount_in: bool,
    sqrt_price_limit: u128,
) -> ProgramResult {

    msg!("Going in!!!");

    // let swap_accounts = Swap{
    //     state: ctx.accounts.state.to_account_info(),
    //     pool: ctx.accounts.pool.to_account_info(),
    //     tickmap: ctx.accounts.tickmap.to_account_info(),
    //     token_x: ctx.accounts.token_x_mint.to_account_info(),
    //     token_y: ctx.accounts.token_y_mint.to_account_info(),
    //     reserve_x: ctx.accounts.reserve_account_x.to_account_info(),
    //     reserve_y: ctx.accounts.reserve_account_y.to_account_info(),
    //     account_x: ctx.accounts.account_x.to_account_info(),
    //     account_y: ctx.accounts.account_y.to_account_info(),
    //     owner: ctx.accounts.initializer.to_account_info(),
    //     program_authority: ctx.accounts.program_authority.to_account_info(),
    //     token_program: ctx.accounts.token_program.to_account_info(),
    // };
    // let invariant_program = ctx.accounts.invariant_program.to_account_info();
    //
    // let cpi_ctx = CpiContext::new(
    //     invariant_program,
    //     swap_accounts
    // );
    // amm::cpi::swap(
    //     cpi_ctx,
    //     x_to_y,
    //     amount,
    //     by_amount_in,
    //     sqrt_price_limit
    // );

    // amm::cpi::swap(
    //     CpiContext::new_with_signer(
    //     invariant_program,
    //     swap_accounts,
    //     &[
    //         [   b"poolv1",
    //             _fee_tier_address.as_ref(),
    //             ctx.accounts.token_x_mint.to_account_info().key.as_ref(),
    //             ctx.accounts.token_y_mint.to_account_info().key.as_ref(),
    //             &[ctx.accounts.pool.load()?.bump]
    //         ].as_ref()
    //     ])
    //                , _fee_tier_address,
    //                x_to_y, amount, by_amount_in, sqrt_price_limit)?;

    Ok(())

}