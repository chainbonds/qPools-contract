use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};
use crate::state::{PortfolioAccount};
use crate::utils::seeds;

//use amm::{self, Tickmap, State, Pool, Tick, Position, PositionList};

#[derive(Accounts)]
#[instruction(_bump:u8, amount: u64)]
pub struct TransferToPortfolio<'info> {

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump

    )]
    pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,

    #[account(mut)]
    pub user_owned_token_account: Box<Account<'info, TokenAccount>>,
    
    #[account(mut,         
        constraint = &pda_owned_token_account.owner == &portfolio_pda.key(),
    )]
    pub pda_owned_token_account: Box<Account<'info,TokenAccount>>,

    pub token_mint: Account<'info, Mint>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,

}





pub fn handler(
    ctx: Context<TransferToPortfolio>,
    _bump: u8,
    amount: u64,
) -> ProgramResult {
    msg!("transfer initial funds from user to portfolio");
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_owned_token_account.to_account_info(),
        to: ctx.accounts.pda_owned_token_account.to_account_info(),
        authority: ctx.accounts.owner.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount as u64)?;

    let portfolio = &mut ctx.accounts.portfolio_pda;
    portfolio.initial_amount_USDC = amount as u64;
    portfolio.remaining_amount_USDC = amount as u64;
    msg!("amount written to USDC init {}", portfolio.initial_amount_USDC);

    
    Ok(())
}


pub fn read_portfolio_account(ctx: Context<TransferToPortfolio>, _bump: u8, amount: u64) -> ProgramResult {
    msg!("amount read {}", ctx.accounts.portfolio_pda.initial_amount_USDC);
    Ok(())

}