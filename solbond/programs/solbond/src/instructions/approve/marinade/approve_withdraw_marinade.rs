use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint};
use crate::state::{PortfolioAccount, PositionAccountMarinade};
use crate::utils::seeds;

#[derive(Accounts, Clone)]
#[instruction(
    _bump_portfolio: u8,
    _bump_position: u8,
    _bump_marinade: u8,
    _msol_out_amount: u64,
    _index: u32,
)]
pub struct ApproveWithdrawMarinade<'info> {

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [
            owner.key().as_ref(),
            &_index.to_le_bytes(),
            seeds::USER_POSITION_STRING
        ],
        bump = _bump_position,
    )]
    pub position_pda: Box<Account<'info, PositionAccountMarinade>>,

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
    ctx: Context<ApproveWithdrawMarinade>,
    _bump_portfolio: u8,
    _bump_position: u8,
    _bump_marinade: u8,
    _msol_out_amount: u64,
    _index: u32,
) -> ProgramResult {

    assert!(
        ctx.accounts.portfolio_pda.key() == ctx.accounts.position_pda.portfolio_pda,
        "The provided portfolio_pda doesn't match the approved!"
    );
    assert!(
        ctx.accounts.position_pda.is_fulfilled,
        "position not fulfilled yet!"
    );

    let portfolio = & mut ctx.accounts.portfolio_pda;
    portfolio.num_redeemed += 1;
    let position_account = &mut ctx.accounts.position_pda;
    position_account.redeem_approved = true;

    position_account.msol_out_amount = _msol_out_amount;

    Ok(())
}
