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

    #[account(mut)]
    pub fees_qpools_a: Box<Account<'info, TokenAccount>>,
 
    pub system_program: AccountInfo<'info>,

}


pub fn handler(
    ctx: Context<TransferRedeemedToUser>,
    _bump_portfolio: u8,
    amount: u64,
) -> ProgramResult {
    let amount_after_fee;
    let portfolio = &mut ctx.accounts.portfolio_pda;
    if amount > portfolio.initial_amount_USDC {
        msg!("Made some profits, will take 20% fees :P");
        let fee_amount = (amount * 20)/(100);
        amount_after_fee  = amount - fee_amount;
        msg!(&format!("amount to take as fee {}", fee_amount));
        msg!(&format!("amount to give to user {}", amount_after_fee));

        let cpi_accounts_fees = Transfer {
            from: ctx.accounts.pda_owned_user_a.to_account_info(),
            to: ctx.accounts.fees_qpools_a.to_account_info(),
            authority: ctx.accounts.portfolio_pda.to_account_info(),
        };
        let cpi_program_fees = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new_with_signer(
            cpi_program_fees,
            cpi_accounts_fees,
            &[
                [
                    ctx.accounts.portfolio_owner.key.as_ref(),
                    seeds::PORTFOLIO_SEED,
                    &[_bump_portfolio]
                ].as_ref()
            ],

        ), fee_amount)?;

        msg!("transered fees to qPools");

        
    } else {
        msg!("zero fees, sorry for your losses");
        amount_after_fee = amount;
        
    }
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
        ), amount_after_fee as u64)?;
    

    Ok(())
}