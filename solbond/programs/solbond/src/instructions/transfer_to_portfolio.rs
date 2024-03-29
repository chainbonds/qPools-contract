use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};
use crate::state::{PortfolioAccount, UserCurrencyAccount};
use crate::utils::seeds;

#[derive(Accounts)]
#[instruction(
    _bump_portfolio:u8, 
    _bump_user_currency: u8,
    _bump_ata: u8,
)]

    pub struct TransferToPortfolio<'info> {

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio

    )]
    pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,

    #[account(mut)]
    pub user_owned_token_account: Box<Account<'info, TokenAccount>>,
    
    #[account(
        init_if_needed,
        payer = owner,
        token::mint = token_mint,
        token::authority = portfolio_pda,
        seeds = [owner.key().as_ref(),token_mint.key().as_ref(),seeds::TOKEN_ACCOUNT_SEED],
        bump = _bump_ata,
        constraint = &pda_owned_token_account.owner == &portfolio_pda.key(),
    )]
    pub pda_owned_token_account: Box<Account<'info,TokenAccount>>,

    #[account(
        mut,
        seeds = [
            owner.key().as_ref(),
            token_mint.key().as_ref(),
            seeds::USER_CURRENCY_STRING
        ],
        bump = _bump_user_currency,
    )]
    pub user_currency_pda_account: Account<'info, UserCurrencyAccount>,

    pub token_mint: Account<'info, Mint>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,

}





pub fn handler(
    ctx: Context<TransferToPortfolio>,
    _bump_portfolio: u8,
    _bump_user_currency: u8,
    _bump_ata: u8,
) -> ProgramResult {
   
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_owned_token_account.to_account_info(),
        to: ctx.accounts.pda_owned_token_account.to_account_info(),
        authority: ctx.accounts.owner.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();

    token::transfer(
        CpiContext::new_with_signer(cpi_program, cpi_accounts,
            &[
                    [
                        ctx.accounts.owner.key().as_ref(), 
                        seeds::PORTFOLIO_SEED,
                        &[_bump_portfolio]
                    ].as_ref()
                ],
            ), ctx.accounts.user_currency_pda_account.initial_amount)?;
    
    Ok(())
}


