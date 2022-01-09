use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use crate::state::{BondPoolAccount, InvariantPoolAccount};
use amm::cpi::accounts::ClaimFee;
use amm::program::Amm;
//use amm::{self, Tickmap, State, Pool, Tick, Position, PositionList};

#[derive(Accounts)]
#[instruction(
    _bump_bond_pool_account: u8,
    index: u32, 
    lower_tick_index: i32, 
    upper_tick_index: i32
)]
pub struct ClaimFeeInstruction<'info> {

    #[account(signer, mut)]
    pub initializer: AccountInfo<'info>,
    #[account(mut)]
    pub state: AccountInfo<'info>,
    #[account(mut)]
    pub pool: AccountInfo<'info>,
    #[account(mut)]
    pub position: AccountInfo<'info>,
    #[account(mut)]
    pub lower_tick: AccountInfo<'info>,
    #[account(mut)]
    pub upper_tick: AccountInfo<'info>,

    #[account(
        seeds=[initializer.key.as_ref(), b"bondPoolAccount"],
        bump = _bump_bond_pool_account
    )]
    pub owner: AccountInfo<'info>,

    //#[account(constraint = token_x.to_account_info().key == &pool.load()?.token_x,)]
    pub token_x: Account<'info, Mint>,

    // #[account(constraint = token_y.to_account_info().key == &pool.load()?.token_y,)]
    pub token_y: Account<'info, Mint>,

    #[account(mut,
        constraint = &account_x.mint == token_x.to_account_info().key,
        constraint = &account_x.owner == owner.key,
    )]
    // this is the x token account of bondPool
    pub account_x: Box<Account<'info, TokenAccount>>,

    #[account(mut,
        constraint = &account_y.mint == token_y.to_account_info().key,
        constraint = &account_y.owner == owner.key
    )]

    // this is the y token account of bondPool
    pub account_y: Box<Account<'info, TokenAccount>>,

    #[account(mut,
        constraint = &reserve_x.mint == token_x.to_account_info().key,
        constraint = &reserve_x.owner == program_authority.key,
        //constraint = reserve_x.to_account_info().key == &pool.load()?.token_x_reserve
    )]
    pub reserve_x: Box<Account<'info, TokenAccount>>,

    #[account(mut,
        constraint = &reserve_y.mint == token_y.to_account_info().key,
        constraint = &reserve_y.owner == program_authority.key,
        //constraint = reserve_y.to_account_info().key == &pool.load()?.token_y_reserve
     )]
    pub reserve_y: Box<Account<'info, TokenAccount>>,

    //#[account(constraint = &state.load()?.authority == program_authority.key)]
    pub program_authority: AccountInfo<'info>,

    #[account(address = token::ID)]
    pub token_program: AccountInfo<'info>,

    pub invariant_program: Program<'info, Amm>,
    pub system_program: AccountInfo<'info>,


}



pub fn handler(
    ctx: Context<ClaimFeeInstruction>,
    _bump_bond_pool_account: u8,
    index: u32, 
    lower_tick_index: i32, 
    upper_tick_index: i32,
) -> ProgramResult {

    // TODO: Owner should be this program, not the payer from the other program!

    let claim_fee_accounts = ClaimFee {
        state: ctx.accounts.state.to_account_info(),
        pool: ctx.accounts.pool.to_account_info(),
        position: ctx.accounts.position.to_account_info(),
        lower_tick: ctx.accounts.lower_tick.to_account_info(),
        upper_tick: ctx.accounts.upper_tick.to_account_info(),
        owner: ctx.accounts.owner.to_account_info(),
        token_x: ctx.accounts.token_x.to_account_info(),
        token_y: ctx.accounts.token_y.to_account_info(),
        account_x: ctx.accounts.account_x.to_account_info(),
        account_y: ctx.accounts.account_y.to_account_info(),
        reserve_x: ctx.accounts.reserve_x.to_account_info(),
        reserve_y: ctx.accounts.reserve_y.to_account_info(),
        program_authority: ctx.accounts.program_authority.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };
    let invariant_program = ctx.accounts.invariant_program.to_account_info();


    msg!("index: {}", index);
    msg!("lower_tick_index: {}", lower_tick_index);
    msg!("upper_tick_index: {}", upper_tick_index);

    amm::cpi::claim_fee(
        CpiContext::new_with_signer(
            invariant_program,
            claim_fee_accounts,
        &[
                [
                    ctx.accounts.initializer.key.as_ref(), b"bondPoolAccount",
                    &[_bump_bond_pool_account]
                ].as_ref()
            ]
        ),
        index,
        lower_tick_index,
        upper_tick_index,
    )?;

    msg!("swap seems to have gone through!");

    Ok(())
}