use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer,Mint};
use crate::state::{PortfolioAccount,UserCurrencyAccount};
use crate::utils::seeds;
use crate::ErrorCode;

//use amm::{self, Tickmap, State, Pool, Tick, Position, PositionList};

#[derive(Accounts)]
#[instruction(
    _bump_user_currency: u8,
    _bump_ata: u8,

)]
pub struct TransferRedeemedToUser<'info> {
    #[account(mut,
    //seeds = [portfolio_owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,

    //#[account(mut)]
    //pub portfolio_owner: AccountInfo<'info>,

    #[account(mut)]
    pub puller: Signer<'info>,

    #[account(
        mut,
        seeds = [
            portfolio_pda.owner.key().as_ref(),
            currency_mint.key().as_ref(),
            seeds::USER_CURRENCY_STRING
        ],
        bump = _bump_user_currency,
    )]
    pub user_currency_pda_account: Box<Account<'info, UserCurrencyAccount>>,

    //      user_token: SwapToken  block
    #[account(
        mut,
        constraint = &user_owned_user_a.owner == &portfolio_pda.owner.key(),
    )]
    pub user_owned_user_a: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        seeds = [portfolio_pda.owner.key().as_ref(),currency_mint.key().as_ref(),seeds::TOKEN_ACCOUNT_SEED],
        bump = _bump_ata,
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
    _bump_user_currency: u8,
    _bump_ata: u8,
) -> ProgramResult {

    //let amount_after_fee;
    if ctx.accounts.portfolio_pda.num_redeemed < ctx.accounts.portfolio_pda.num_positions {
        return Err(ErrorCode::NotReadyForTransferBack.into());
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
                    ctx.accounts.portfolio_pda.owner.key().as_ref(),
                    seeds::PORTFOLIO_SEED,
                    &[ctx.accounts.portfolio_pda.bump]
                ].as_ref()
            ],

        ), ctx.accounts.pda_owned_user_a.amount as u64)?;

    // close currency account
    let owner_acc_info = ctx.accounts.puller.to_account_info();
    let user_starting_lamports = owner_acc_info.lamports();
    let user_currency_acc_info = ctx.accounts.user_currency_pda_account.to_account_info();
    **owner_acc_info.lamports.borrow_mut() = user_starting_lamports.checked_add(user_currency_acc_info.lamports()).unwrap();
    **user_currency_acc_info.lamports.borrow_mut() = 0;
    let mut user_currency_data = user_currency_acc_info.data.borrow_mut();
    user_currency_data.fill(0);

    
    let portfolio = &mut ctx.accounts.portfolio_pda;
    portfolio.num_currencies_sent_back += 1;
    if portfolio.num_currencies_sent_back >= portfolio.num_currencies {
        // close portfolio account
        // only if all positions have been sent back to user
        let owner_acc_info = ctx.accounts.puller.to_account_info();
        let user_starting_lamports = owner_acc_info.lamports();
        let portfolio_acc_info = ctx.accounts.portfolio_pda.to_account_info();
        **owner_acc_info.lamports.borrow_mut() = user_starting_lamports.checked_add(portfolio_acc_info.lamports()).unwrap();
        **portfolio_acc_info.lamports.borrow_mut() = 0;
        let mut portfolio_data = portfolio_acc_info.data.borrow_mut();
        portfolio_data.fill(0);
    }
    

    Ok(())
}