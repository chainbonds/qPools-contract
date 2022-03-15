use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};
use crate::state::{PortfolioAccount, UserCurrencyAccount};
use crate::utils::seeds;

#[derive(Accounts)]
#[instruction(
    _bump_portfolio:u8, 
    _bump_user_currency: u8,
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
    
    #[account(mut,         
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
) -> ProgramResult {
    msg!("transfer initial funds from user to portfolio");
    msg!("how much a dollar cost {}", ctx.accounts.user_currency_pda_account.initial_amount);
    msg!("balance user owned token {}", ctx.accounts.user_owned_token_account.amount);
    
    msg!("huso1 mint {}", ctx.accounts.user_owned_token_account.mint.key());
    msg!("huso1 del amount {}", ctx.accounts.user_owned_token_account.delegated_amount);
    msg!("huso1 owner {}", ctx.accounts.user_owned_token_account.owner.key());
    msg!("huso1 pubkey {}", ctx.accounts.user_owned_token_account.to_account_info().key());


    msg!("balance pda owned token {}", ctx.accounts.pda_owned_token_account.amount);
    msg!("huso2 mint {}", ctx.accounts.pda_owned_token_account.mint.key());
    msg!("huso2 del amount {}", ctx.accounts.pda_owned_token_account.delegated_amount);
    msg!("huso2 owner {}", ctx.accounts.pda_owned_token_account.owner.key());
    msg!("huso2 pubkey {}", ctx.accounts.pda_owned_token_account.to_account_info().key());
    msg!("wsol {}", ctx.accounts.token_mint.key());
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_owned_token_account.to_account_info(),
        to: ctx.accounts.pda_owned_token_account.to_account_info(),
        authority: ctx.accounts.owner.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();

    //let portfolio = &mut ctx.accounts.portfolio_pda;

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


