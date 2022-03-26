use anchor_lang::prelude::*;
use anchor_spl::token::{Token};
use crate::state::{PortfolioAccount};
use crate::utils::seeds;



#[derive(Accounts, Clone)]
#[instruction(
    _bump:u8, 
)]
pub struct ApproveWithdrawPortfolio<'info> {

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump
    )]
    pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,
    
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,

}





pub fn handler(
    ctx: Context<ApproveWithdrawPortfolio>,
    _bump: u8,
) -> ProgramResult {
    let portfolio_account = &mut ctx.accounts.portfolio_pda;
    //assert!(portfolio_account.fully_created, "portfolio can't be withdrawn before full creation");
    
    portfolio_account.to_be_redeemed = true;
    
    Ok(())
}
