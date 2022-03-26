use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint};
use crate::state::{PortfolioAccount, PositionAccountSaber};
use crate::utils::seeds;
use crate::ErrorCode;

#[derive(Accounts, Clone)]
#[instruction(
    _bump_portfolio: u8,
    _bump_position: u8,
    _pool_token_amount: u64,
    _minimum_token_amount: u64,
    _index: u32,
)]
pub struct ApproveWithdrawAmountSaber<'info> {

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
    pub position_pda: Box<Account<'info, PositionAccountSaber>>,

    #[account(
        mut,
        seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,
    
    pub pool_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,

}


pub fn handler(
    ctx: Context<ApproveWithdrawAmountSaber>,
    _bump_portfolio: u8,
    _bump_position: u8,
    _pool_token_amount: u64,
    _minimum_token_amount: u64,
    _index: u32,
) -> ProgramResult {

    assert!(
        ctx.accounts.portfolio_pda.key() == ctx.accounts.position_pda.portfolio_pda,
        "The provided portfolio_pda doesn't match the approved!"
    );
    assert!(
        ctx.accounts.pool_mint.key() == ctx.accounts.position_pda.pool_address,
        "The mint address provided in the context doesn't match the approved mint!"
    );
    if !ctx.accounts.position_pda.is_fulfilled {
        return Err(ErrorCode::PositionNotFulfilledYet.into());
    }

    let position_account = &mut ctx.accounts.position_pda;
    position_account.index = _index;
    position_account.redeem_approved = true;

    position_account.pool_token_amount = _pool_token_amount;
    position_account.minimum_token_amount_out = _minimum_token_amount;

    Ok(())
}
