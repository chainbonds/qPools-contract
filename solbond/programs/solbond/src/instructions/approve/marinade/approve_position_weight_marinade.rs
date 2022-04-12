use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint};
use crate::state::{PortfolioAccount, PositionAccountMarinade};
use crate::utils::seeds;
use crate::ErrorCode;
use anchor_lang::solana_program::{program::invoke, system_instruction, system_program};

use marinade_finance::state::{State};

#[derive(Accounts)]
#[instruction(
    _bump_portfolio: u8,
    _bump_position: u8,
    _bump_marinade: u8,
    _weight: u64,
    _initial_sol_amount: u64,
    _index: u32,
)]
pub struct ApprovePositionWeightMarinade<'info> {

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space =8 + PositionAccountMarinade::LEN,
        seeds = [
            owner.key().as_ref(),
            &_index.to_le_bytes(),
            seeds::USER_POSITION_STRING
        ],

        bump = _bump_position,
    )]
    pub position_pda: Box<Account<'info, PositionAccountMarinade>>,

    //read only
    pub state: Box<Account<'info, State>>,

    #[account(
        mut,
        seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,

    #[account(
        mut,
        seeds = [owner.key().as_ref(), seeds::USER_MARINADE_SEED], bump = _bump_marinade
    )] // have to put a check on this that its the right account
    pub owner_sol_pda: AccountInfo<'info>,

    //#[account(mut)]
    //marinade_position_sol_account: AccountInfo<'info>,

    // pub pool_mint: Account<'info, Mint>,
    //pub pool_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,

}

pub fn handler(
    ctx: Context<ApprovePositionWeightMarinade>,
    _bump_portfolio: u8,
    _bump_position: u8,
    _bump_marinade: u8,
    _weight: u64,
    _initial_sol_amount: u64,
    _index: u32,
) -> ProgramResult {

    if _index > ctx.accounts.portfolio_pda.num_positions {
        return Err(ErrorCode::IndexHigherThanNumPos.into());
    }

    if _initial_sol_amount < ctx.accounts.state.min_deposit {
        return Err(ErrorCode::MinStakeAmount.into());
    }

    let position_account = &mut ctx.accounts.position_pda;
    position_account.index = _index;
    position_account.weight = _weight;
    // don't need to save it!
    //position_account.min_deposit_when_approved = ctx.accounts.state.min_deposit;
    position_account.initial_sol_amount = _initial_sol_amount;
    position_account.withdraw_sol_amount = 0;



    position_account.is_fulfilled = false;
    position_account.is_redeemed = false;
    position_account.redeem_approved = false;
    position_account.bump = _bump_position;

    //position_account.pool_address = ctx.accounts.pool_mint.key().clone();
    position_account.portfolio_pda = ctx.accounts.portfolio_pda.key().clone();

    // transfer the sol amount from owner to the marinade_position_sol_account

    invoke(
        &system_instruction::transfer(
            ctx.accounts.owner.key,
            ctx.accounts.owner_sol_pda.key,
            _initial_sol_amount,
        ),
        &[
            ctx.accounts.owner.to_account_info().clone(),
            ctx.accounts.owner_sol_pda.clone(),
            ctx.accounts.system_program.to_account_info().clone()
        ]
    );





    Ok(())
}