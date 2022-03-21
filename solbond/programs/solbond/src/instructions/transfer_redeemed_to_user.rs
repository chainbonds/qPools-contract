use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer,Mint};
use crate::state::{PortfolioAccount,UserCurrencyAccount};
use crate::utils::seeds;
use crate::ErrorCode;

//use amm::{self, Tickmap, State, Pool, Tick, Position, PositionList};

#[derive(Accounts)]
#[instruction(
    _bump_portfolio: u8,
    _bump_user_currency: u8,
)]
pub struct TransferRedeemedToUser<'info> {
    #[account(mut,
    seeds = [portfolio_owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,

    #[account(mut)]
    pub portfolio_owner: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [
            portfolio_owner.key().as_ref(),
            currency_mint.key().as_ref(),
            seeds::USER_CURRENCY_STRING
        ],
        bump = _bump_user_currency,
    )]
    pub user_currency_pda_account: Box<Account<'info, UserCurrencyAccount>>,

    //      user_token: SwapToken  block
    #[account(
        mut,
        //constraint = &user_owned_user_a.owner == &portfolio_pda.key(),
    )]
    pub user_owned_user_a: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = &pda_owned_user_a.owner == &portfolio_pda.key(),
    )]
    pub pda_owned_user_a: Box<Account<'info, TokenAccount>>,


    pub currency_mint: Account<'info, Mint>,


    // #[account(mut)]
    // pub fees_qpools_a: Box<Account<'info, TokenAccount>>,
 
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,

}


pub fn handler(
    ctx: Context<TransferRedeemedToUser>,
    _bump_portfolio: u8,
    _bump_user_currency: u8,
) -> ProgramResult {

    //let amount_after_fee;
    let portfolio = &mut ctx.accounts.portfolio_pda;
    if portfolio.num_redeemed < portfolio.num_positions {
        return Err(ErrorCode::NotReadyForTransferBack.into());
    }
    // no fees for now 
    /*if portfolio.withdraw_amount_USDC > portfolio.initial_amount_USDC {
        msg!("Made some profits, will take 20% fees :P");
        //let fee_amount = (amount * 20)/(100);
        let profit = portfolio.withdraw_amount_USDC .checked_sub(portfolio.initial_amount_USDC).ok_or_else(| | {ErrorCode::CustomMathError6})?;
        let tmp1 = profit.checked_mul(20).ok_or_else(||{ErrorCode::CustomMathError6})?;
        let fee_amount = tmp1.checked_div(100).ok_or_else(||{ErrorCode::CustomMathError7})?;
        amount_after_fee  = portfolio.withdraw_amount_USDC .checked_sub(fee_amount).ok_or_else(||{ErrorCode::CustomMathError8})?;
        msg!(&format!("amount to take as fee {}", fee_amount));
        msg!(&format!("amount to give to user {}", amount_after_fee));

        let cpi_accounts_fees = Transfer {
            from: ctx.accounts.pda_owned_user_a.to_account_info(),
            to: ctx.accounts.fees_qpools_a.to_account_info(),
            authority: ctx.accounts.portfolio_pda.to_account_info(),
        };
        ctx.accounts.pda_owned_user_a.amount;
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
        amount_after_fee = portfolio.withdraw_amount_USDC ;
        
    }*/

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

        ), ctx.accounts.pda_owned_user_a.amount as u64)?;

    // close portfolio account
    let owner_acc_info = ctx.accounts.portfolio_owner.to_account_info();
    let user_starting_lamports = owner_acc_info.lamports();
    let portfolio_acc_info = ctx.accounts.portfolio_pda.to_account_info();
    **owner_acc_info.lamports.borrow_mut() = user_starting_lamports.checked_add(portfolio_acc_info.lamports()).unwrap();
    **portfolio_acc_info.lamports.borrow_mut() = 0;
    let mut portfolio_data = portfolio_acc_info.data.borrow_mut();
    portfolio_data.fill(0);

    Ok(())
}