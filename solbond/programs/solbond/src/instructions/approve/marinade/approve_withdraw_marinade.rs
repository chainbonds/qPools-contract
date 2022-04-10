use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use crate::state::{PortfolioAccount, PositionAccountMarinade};
use crate::utils::seeds;
use crate::ErrorCode;

#[derive(Accounts, Clone)]
#[instruction(
    _bump_portfolio: u8,
    _bump_position: u8,
    _bump_msol_ata: u8,
    _bump_user_msol_ata: u8,
    _index: u32,
)]
pub struct ApproveWithdrawMarinade<'info> {

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [
            owner.key().as_ref(),
            &_index.to_le_bytes(),
            seeds::USER_POSITION_STRING
        ],
        bump = _bump_position,
    )]
    pub position_pda: Box<Account<'info, PositionAccountMarinade>>,

    #[account(
        mut,
        seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,
    
    pub msol_mint: Account<'info,Mint>,

    #[account(mut)]
    pub user_msol_account: Account<'info, TokenAccount>,
    #[account(mut,seeds = [owner.key().as_ref(),msol_mint.key().as_ref(),seeds::TOKEN_ACCOUNT_SEED],
    bump = _bump_msol_ata)]
    pub pda_msol_account: Account<'info, TokenAccount>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,

}


pub fn handler(
    ctx: Context<ApproveWithdrawMarinade>,
    _bump_portfolio: u8,
    _bump_position: u8,
    _bump_msol_ata: u8,
    _index: u32,
) -> ProgramResult {

    if ctx.accounts.portfolio_pda.key() != ctx.accounts.position_pda.portfolio_pda {
        return Err(ErrorCode::ProvidedPortfolioNotMatching.into());
    }
    if !ctx.accounts.position_pda.is_fulfilled {
        return Err(ErrorCode::PositionNotFulfilledYet.into());
    }
    if ctx.accounts.position_pda.redeem_approved {
        return Err(ErrorCode::RedeemAlreadyApproved.into());
    }
    if ! ctx.accounts.portfolio_pda.fully_created {
        return Err(ErrorCode::PortfolioNotFullyCreated.into());
    }
    
    let portfolio = & mut ctx.accounts.portfolio_pda;
    portfolio.num_redeemed += 1;
    let position_account = &mut ctx.accounts.position_pda;
    position_account.redeem_approved = true;

    // do the token transfer to user
    let cpi_accounts = Transfer {
        from: ctx.accounts.pda_msol_account.to_account_info(),
        to: ctx.accounts.user_msol_account.to_account_info(),
        authority: ctx.accounts.portfolio_pda.to_account_info(),
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
        ), ctx.accounts.pda_msol_account.amount)?;
    
    let portfolio = &mut ctx.accounts.portfolio_pda;
    portfolio.num_redeemed += 1;
    let position = &mut ctx.accounts.position_pda;
    position.is_redeemed = true;
    //position_account.msol_out_amount = _msol_out_amount;
    let owner_acc_info = ctx.accounts.owner.to_account_info();
    let user_starting_lamports = owner_acc_info.lamports();
    let position_acc_info = ctx.accounts.position_pda.to_account_info();
    **owner_acc_info.lamports.borrow_mut() = user_starting_lamports.checked_add(position_acc_info.lamports()).unwrap();
    **position_acc_info.lamports.borrow_mut() = 0;
    let mut position_data = position_acc_info.data.borrow_mut();
    position_data.fill(0);

    Ok(())
}
