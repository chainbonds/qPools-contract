use anchor_lang::prelude::*;
use anchor_spl::token::{Token};
use crate::state::{PortfolioAccount};
use crate::utils::seeds;

//use amm::{self, Tickmap, State, Pool, Tick, Position, PositionList};
// 3vTbhuwJwR5BadSH9wt29rLf91S57x31ynQZJpG9cf7E

#[derive(Accounts, Clone)]
#[instruction(_bump:u8, weights:[u64; 3])]
pub struct SavePortfolio<'info> {

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + PortfolioAccount::LEN,
        seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump
    )]
    pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,
    
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,

}





pub fn handler(
    ctx: Context<SavePortfolio>,
    _bump: u8,
    weights: [u64; 3]
) -> ProgramResult {
    let sum: u64 = weights.iter().sum();
    assert!(sum/1000 == 1, "weights do not sum to 1!");


    let portfolio_account = &mut ctx.accounts.portfolio_pda;
    //portfolio_account.position_one_pda = ctx.accounts.position_one.clone().key();
    //portfolio_account.position_two_pda = ctx.accounts.position_two.clone().key();
    //portfolio_account.position_two_pda = ctx.accounts.position_two.clone().key();
    
    //portfolio_account.pool_one_pda = ctx.accounts.pool_one.clone().key();
    //portfolio_account.pool_two_pda = ctx.accounts.pool_two.clone().key();
    //portfolio_account.pool_three_pda = ctx.accounts.pool_three.clone().key();

    //portfolio_account.user_lp_token_account_one = ctx.accounts.user_lp_token_account_one.clone().key();
    //portfolio_account.user_lp_token_account_two = ctx.accounts.user_lp_token_account_two.clone().key();
    //portfolio_account.user_lp_token_account_three = ctx.accounts.user_lp_token_account_three.clone().key();
    
    portfolio_account.owner = ctx.accounts.owner.clone().key();
    portfolio_account.bump = _bump;
    portfolio_account.weights = weights;

    let amounts_init = [0,0,0];
    portfolio_account.amounts_in = amounts_init;

    portfolio_account.initial_amount_USDC = 0;
    portfolio_account.remaining_amount_USDC = 0;


    Ok(())
}