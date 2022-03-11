use anchor_lang::prelude::*;
use anchor_spl::token::{Mint};
use crate::state::{PortfolioAccount,UserCurrencyAccount};
use crate::utils::seeds;



#[derive(Accounts, Clone)]
#[instruction(
    _bump_portfolio: u8,
    _bump_user_currency: u8,
    _withdraw_amount_currency: u64,
)]
pub struct ApproveCurrencyWithdrawAmount<'info> {

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [
            owner.key().as_ref(),
            currency_mint.key().as_ref(),
            seeds::USER_CURRENCY_STRING
        ],
        bump = _bump_user_currency,
    )]
    pub user_currency_pda_account: Account<'info, UserCurrencyAccount>,

    #[account(
        mut,
        seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,
    
    pub currency_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,

}


pub fn handler(
    ctx: Context<ApproveCurrencyWithdrawAmount>,
    _bump_portfolio: u8,
    _bump_user_currency: u8,
    _withdraw_amount_currency: u64,
) -> ProgramResult {
    


    // add checks here that the correct mint is being withdrawn later. 
    let user_currency_pda_account = &mut ctx.accounts.user_currency_pda_account;
  
    user_currency_pda_account.withdraw_amount = _withdraw_amount_currency;
    

    Ok(())
}