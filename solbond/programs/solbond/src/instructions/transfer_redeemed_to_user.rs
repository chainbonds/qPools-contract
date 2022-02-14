use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Transfer};
use crate::state::{PortfolioAccount};
use crate::utils::seeds;

//use amm::{self, Tickmap, State, Pool, Tick, Position, PositionList};

#[derive(Accounts)]
#[instruction(
_bump_portfolio: u8,
amount: u64,

)]
pub struct TransferRedeemedToUser<'info> {
    #[account(mut,
    seeds = [portfolio_owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub portfolio_pda: Account<'info, PortfolioAccount>,

    #[account(mut, signer)]
    pub portfolio_owner: AccountInfo<'info>,


    pub token_program: AccountInfo<'info>,

    //      user_token: SwapToken  block
    #[account(
    mut,
    //constraint = &user_a.owner == &position_pda.key(),
    )]
    pub user_owned_user_a: Box<Account<'info, TokenAccount>>,
    #[account(
    mut,
    //constraint = &user_a.owner == &position_pda.key(),
    )]
    pub pda_owned_user_a: Box<Account<'info, TokenAccount>>,

    pub system_program: AccountInfo<'info>,

}


pub fn handler(
    ctx: Context<TransferRedeemedToUser>,
    _bump_portfolio: u8,
    amount: u64,
) -> ProgramResult {

    msg!("Helloo");
    let cpi_accounts = Transfer {
        from: ctx.accounts.pda_owned_user_a.to_account_info(),
        to: ctx.accounts.user_owned_user_a.to_account_info(),
        authority: ctx.accounts.portfolio_pda.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    token::transfer(
        CpiContext::new_with_signer(
            cpi_program,
            cpi_accounts,
            &[
                [
                    ctx.accounts.portfolio_owner.key.as_ref(),
                    seeds::PORTFOLIO_SEED,
                    &[_bump_portfolio]
                ].as_ref()
            ],
        ), amount as u64)?;


    Ok(())
}
