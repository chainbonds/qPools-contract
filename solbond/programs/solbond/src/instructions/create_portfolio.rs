use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use crate::state::{PortfolioAccount, PositionAccount, TwoWayPoolAccount};
use crate::utils::seeds;
use crate::instructions::{SaberLiquidityInstruction, create_position_saber};
use stable_swap_anchor::*;
use stable_swap_anchor::{Deposit, SwapToken, SwapUserContext};
use anchor_lang::solana_program::system_program;
use stable_swap_anchor::StableSwap;

//use amm::{self, Tickmap, State, Pool, Tick, Position, PositionList};

#[derive(Accounts)]
// #[instruction(amount)]
#[instruction(_bump:u8)]
pub struct SavePortfolio<'info> {

    #[account(mut, signer)]
    pub owner: AccountInfo<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + PortfolioAccount::LEN,
        seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump
    )]
    pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,
    
    #[account(mut)]
    pub position_one: AccountInfo<'info>,
    #[account(mut)]
    pub position_two: AccountInfo<'info>,
    #[account(mut)]
    pub position_three: AccountInfo<'info>,

    #[account(mut)]
    pub pool_one: AccountInfo<'info>,
    #[account(mut)]
    pub pool_two: AccountInfo<'info>,
    #[account(mut)]
    pub pool_three: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,

}

/*
    Based on the portfolio and weights, calculate how much to re-distribute into each pool
*/
// // TODO: Replace everything by decimals?
// pub fn calculate_amount_per_pool(x: u64) -> [u64; 5] {
//
//     let default_pay_in_amount: u64 = x / 5;
//
//     return [default_pay_in_amount, default_pay_in_amount, default_pay_in_amount, default_pay_in_amount, default_pay_in_amount];
// }


pub fn handler(
    ctx: Context<SavePortfolio>,
    _bump: u8,
) -> ProgramResult {
    
    
 
    let portfolio_account = &mut ctx.accounts.portfolio_pda;
    portfolio_account.position_one_pda = ctx.accounts.position_one.clone().key();
    portfolio_account.position_two_pda = ctx.accounts.position_two.clone().key();
    portfolio_account.position_two_pda = ctx.accounts.position_two.clone().key();
    
    portfolio_account.pool_one_pda = ctx.accounts.pool_one.clone().key();
    portfolio_account.pool_two_pda = ctx.accounts.pool_two.clone().key();
    portfolio_account.pool_three_pda = ctx.accounts.pool_three.clone().key();
    
    portfolio_account.owner = ctx.accounts.owner.clone().key();
    
    portfolio_account.bump = _bump;

    Ok(())
}