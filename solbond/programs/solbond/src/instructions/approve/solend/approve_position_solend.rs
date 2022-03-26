use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint};
use crate::state::{PortfolioAccount, PositionAccountSolend, UserCurrencyAccount};
use crate::utils::seeds;



#[derive(Accounts)]
#[instruction(
    _bump_portfolio: u8,
    _bump_position: u8,
    _bump_currency: u8,
    _weight: u64,
    _input_amount: u64,
    _index: u32,
)]
pub struct ApprovePositionWeightSolend<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space =8 + PositionAccountSolend::LEN,
        seeds = [
            owner.key().as_ref(),
            &_index.to_le_bytes(),
            seeds::USER_POSITION_STRING
        ],

        bump = _bump_position,
    )]
    pub position_pda: Box<Account<'info, PositionAccountSolend>>,

    #[account(
        mut,
        seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,


    #[account(
        mut,
        seeds = [
            owner.key().as_ref(),
            currency_mint.key().as_ref(),
            seeds::USER_CURRENCY_STRING
        ],
        bump = _bump_currency,
    )]
    pub user_currency_pda_account: Account<'info, UserCurrencyAccount>,


    pub currency_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,



}


pub fn handler(
    ctx: Context<ApprovePositionWeightSolend>,
    _bump_portfolio: u8,
    _bump_position: u8,
    _bump_currency: u8,
    _weight: u64,
    _input_amount: u64,
    _index: u32,
) -> ProgramResult {

    // let msg = format!("{index}{seed}", index = _index, seed = seeds::USER_POSITION_STRING);
    // msg!("Seed string is: ");
    // msg!(&msg);

    let position_account = &mut ctx.accounts.position_pda;
    position_account.index = _index;
    position_account.weight = _weight;

    position_account.initial_amount = _input_amount;
    position_account.withdraw_amount = 0;



    position_account.is_fulfilled = false;
    position_account.is_redeemed = false;
    position_account.redeem_approved = false;
    position_account.bump = _bump_position;

    //position_account.pool_address = ctx.accounts.pool_mint.key().clone();
    position_account.portfolio_pda = ctx.accounts.portfolio_pda.key().clone();
    position_account.currency_mint = ctx.accounts.currency_mint.key().clone();





    Ok(())
}
