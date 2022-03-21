use anchor_lang::prelude::*;
use anchor_spl::token::{Token};
use crate::state::{PortfolioAccount};
use crate::utils::seeds;



#[derive(Accounts, Clone)]
#[instruction(
    _bump:u8, 
    _sum_of_weight:u64,
    _num_positions:u32,
)]
pub struct SavePortfolio<'info> {

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
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
    _sum_of_weights: u64,
    _num_positions: u32,
) -> ProgramResult {
    //let sum: u64 = _weights.iter().sum();
    //assert!(sum/1000 == 1, "weights do not sum to 1!");


    let portfolio_account = &mut ctx.accounts.portfolio_pda;
  
    portfolio_account.owner = ctx.accounts.owner.clone().key();
    
    portfolio_account.bump = _bump;
    portfolio_account.fully_created = false;
    portfolio_account.to_be_redeemed = false;

    portfolio_account.sum_of_weights = _sum_of_weights;
    portfolio_account.num_positions = _num_positions;
    portfolio_account.num_redeemed = 0 as u32;
    portfolio_account.num_created = 0 as u32;

    let clock = Clock::get().unwrap();
    portfolio_account.start_timestamp = clock.unix_timestamp;


    Ok(())
}