use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint};
use crate::state::{PortfolioAccount, PositionAccountSolend};
use crate::utils::seeds;
use crate::ErrorCode;

#[derive(Accounts, Clone)]
#[instruction(
    _bump_portfolio: u8,
    _bump_position: u8,
    _withdraw_amount: u64,
    _index: u32,
)]
pub struct ApproveWithdrawAmountSolend<'info> {

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [
            owner.key().as_ref(),
            &_index.to_le_bytes(),
            seeds::USER_POSITION_STRING
        ],
        bump = _bump_position
    )]
    pub position_pda: Box<Account<'info, PositionAccountSolend>>,

    #[account(
        mut,
        seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,
    
    //pub pool_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,

}


pub fn handler(
    ctx: Context<ApproveWithdrawAmountSolend>,
    _bump_portfolio: u8,
    _bump_position: u8,
    _withdraw_amount: u64,
    _index: u32,
) -> Result<()> {

    if ctx.accounts.portfolio_pda.key() != ctx.accounts.position_pda.portfolio_pda {
        return Err(error!(ErrorCode::ProvidedPortfolioNotMatching));
    }
    if !ctx.accounts.position_pda.is_fulfilled {
        return Err(error!(ErrorCode::PositionNotFulfilledYet));
    }
    if ctx.accounts.position_pda.redeem_approved {
        return Err(error!(ErrorCode::RedeemAlreadyApproved));
    }
    if ! ctx.accounts.portfolio_pda.fully_created {
        return Err(error!(ErrorCode::PortfolioNotFullyCreated));
    }


    let position_account = &mut ctx.accounts.position_pda;
    position_account.index = _index;
    position_account.redeem_approved = true;

    position_account.withdraw_amount = _withdraw_amount;

    Ok(())
}
