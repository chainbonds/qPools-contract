use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint};
use crate::state::{PortfolioAccount, PositionAccountSaber};
use crate::utils::seeds;


#[derive(Accounts)]
#[instruction(
    _bump_portfolio: u8,
    _weight: u64,
    _max_initial_token_a_amount: u64,
    _max_initial_token_b_amount: u64,
    _min_mint_amount: u64,
    _index: u32,
)]
pub struct ApprovePositionWeightSaber<'info> {

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + PositionAccountSaber::LEN,
        seeds = [
            owner.key().as_ref(),
            &_index.to_le_bytes(),
            seeds::USER_POSITION_STRING
        ],
        bump,
    )]
    pub position_pda: Box<Account<'info, PositionAccountSaber>>,

    #[account(
        mut,
        seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,

    // pub pool_mint: Account<'info, Mint>,
    #[account(mut)]
    pub pool_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,

}

pub fn handler(
    ctx: Context<ApprovePositionWeightSaber>,
    _bump_portfolio: u8,
    _weight: u64,
    _max_initial_token_a_amount: u64,
    _max_initial_token_b_amount: u64,
    _min_mint_amount: u64,
    _index: u32,
) -> Result<()> {

    // let msg = format!("{index}{seed}", index = _index, seed = seeds::USER_POSITION_STRING);
    // msg!("Seed string is: ");
    // msg!(&msg);

    let position_account = &mut ctx.accounts.position_pda;
    position_account.index = _index;
    position_account.weight = _weight;

    position_account.max_initial_token_a_amount = _max_initial_token_a_amount;
    position_account.max_initial_token_b_amount = _max_initial_token_b_amount;
    position_account.min_mint_amount = _min_mint_amount;

    position_account.pool_token_amount = 0;
    position_account.minimum_token_amount_out = 0;


    position_account.is_fulfilled = false;
    position_account.is_redeemed = false;
    position_account.redeem_approved = false;
    position_account.bump = *ctx.bumps.get("position_pda").unwrap();

    position_account.pool_address = ctx.accounts.pool_mint.key().clone();
    position_account.portfolio_pda = ctx.accounts.portfolio_pda.key().clone();
    


    Ok(())
}