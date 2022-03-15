use anchor_lang::prelude::*;
use anchor_spl::token::{Mint};
use crate::state::{UserCurrencyAccount};
use crate::utils::seeds;



#[derive(Accounts, Clone)]
#[instruction(
    _bump_user_currency: u8,
    _total_amount_currency: u64,
)]
pub struct ApproveInitialCurrencyAmount<'info> {

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + UserCurrencyAccount::LEN,
        seeds = [
            owner.key().as_ref(),
            currency_mint.key().as_ref(),
            seeds::USER_CURRENCY_STRING
        ],
        bump = _bump_user_currency,
    )]
    pub user_currency_pda_account: Account<'info, UserCurrencyAccount>,
    
    #[account(mut)]
    pub currency_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,

}


pub fn handler(
    ctx: Context<ApproveInitialCurrencyAmount>,
    _bump_user_currency: u8,
    _total_amount_currency: u64,
) -> ProgramResult {
    

    msg!("currency pda owner {}", ctx.accounts.user_currency_pda_account.to_account_info().owner);
    let user_currency_pda_account = &mut ctx.accounts.user_currency_pda_account;
  
    user_currency_pda_account.owner = ctx.accounts.owner.clone().key();
    
    user_currency_pda_account.bump = _bump_user_currency;
    user_currency_pda_account.initial_amount = _total_amount_currency;
    user_currency_pda_account.withdraw_amount = 0;
    
    //user_currency_pda_account.mint = ctx.accounts.currency_mint.clone().key();

    Ok(())
}