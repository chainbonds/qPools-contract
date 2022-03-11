use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint};
use crate::state::{PortfolioAccount, PositionAccountSaber};
use crate::utils::seeds;

//use amm::{self, Tickmap, State, Pool, Tick, Position, PositionList};
// 3vTbhuwJwR5BadSH9wt29rLf91S57x31ynQZJpG9cf7E

#[derive(Accounts, Clone)]
#[instruction(
    _bump:u8,
    _weights:Vec<u64>, 
    _num_positions:u32,
    _total_amount_USDC: u64,
)]
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

#[derive(Accounts, Clone)]
#[instruction(
    _bump:u8, 
    _total_amount_USDC: u64,
)]
pub struct ApproveWithdrawPortfolio<'info> {

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump
    )]
    pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,
    
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,

}

#[derive(Accounts)]
#[instruction(
    _bump_portfolio: u8,
    _bump_position: u8,
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
        init_if_needed,
        payer = owner,
        space =
        {
            msg!("hmmmmmm {:?}", _index.to_le_bytes());
            msg!("hmmmmmm 2 {:?}", [owner.key().as_ref(), &_index.to_le_bytes(), seeds::USER_POSITION_STRING]);
            8 + PositionAccountSaber::LEN
        },
        seeds = [
            owner.key().as_ref(),
            &_index.to_le_bytes(),
            seeds::USER_POSITION_STRING
        ],
        bump = _bump_position,
    )]
    pub position_pda: Box<Account<'info, PositionAccountSaber>>,

    #[account(
        mut,
        seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,

    pub pool_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,

}



#[derive(Accounts, Clone)]
#[instruction(
    _bump_portfolio: u8,
    _bump_position: u8,
    _pool_token_amount: u64,
    _minimum_token_amount: u64,
    _index: u32,
)]
pub struct ApproveWithdrawAmountSaber<'info> {

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [
            owner.key().as_ref(),
            &_index.to_le_bytes(),
            seeds::USER_POSITION_STRING
        ],
        bump = _bump_position
    )]
    pub position_pda: Box<Account<'info, PositionAccountSaber>>,

    #[account(
        mut,
        seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,
    
    pub pool_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,

}




pub fn handler(
    ctx: Context<SavePortfolio>,
    _bump: u8,
    _weights: Vec<u64>,
    _num_positions: u32,
    _total_amount_USDC: u64,
) -> ProgramResult {
    let sum: u64 = _weights.iter().sum();
    assert!(sum/1000 == 1, "weights do not sum to 1!");


    let portfolio_account = &mut ctx.accounts.portfolio_pda;
  
    portfolio_account.owner = ctx.accounts.owner.clone().key();
    
    portfolio_account.bump = _bump;
    portfolio_account.fully_created = false;
    portfolio_account.to_be_redeemed = false;
    portfolio_account.initial_amount_USDC = _total_amount_USDC;
    
    portfolio_account.num_positions = _num_positions;
    portfolio_account.num_redeemed = 0;

    let clock = Clock::get().unwrap();
    portfolio_account.start_timestamp = clock.unix_timestamp;


    Ok(())
}

pub fn approve_position_weight_saber(
    ctx: Context<ApprovePositionWeightSaber>,
    _bump_portfolio: u8,
    _bump_position: u8,
    _weight: u64,
    _max_initial_token_a_amount: u64,
    _max_initial_token_b_amount: u64,
    _min_mint_amount: u64,
    _index: u32,
) -> ProgramResult {

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
    position_account.bump = _bump_position;

    position_account.pool_address = ctx.accounts.pool_mint.key().clone();
    position_account.portfolio_pda = ctx.accounts.portfolio_pda.key().clone();
    


    Ok(())
}

pub fn approve_withdraw_amount_saber(
    ctx: Context<ApproveWithdrawAmountSaber>,
    _bump_portfolio: u8,
    _bump_position: u8,
    _pool_token_amount: u64,
    _minimum_token_amount: u64,
    _index: u32,
) -> ProgramResult {

    assert!(
        ctx.accounts.portfolio_pda.key() == ctx.accounts.position_pda.portfolio_pda,
        "The provided portfolio_pda doesn't match the approved!"
    );
    assert!(
        ctx.accounts.pool_mint.key() == ctx.accounts.position_pda.pool_address,
        "The mint address provided in the context doesn't match the approved mint!"
    );


    let position_account = &mut ctx.accounts.position_pda;
    position_account.index = _index;
    position_account.redeem_approved = true;

    position_account.pool_token_amount = _pool_token_amount;
    position_account.minimum_token_amount_out = _minimum_token_amount;

    Ok(())
}

pub fn approve_withdraw_to_user(
    ctx: Context<ApproveWithdrawPortfolio>,
    _bump: u8,
    _total_amount_USDC: u64,
) -> ProgramResult {
    let portfolio_account = &mut ctx.accounts.portfolio_pda;
    //assert!(portfolio_account.fully_created, "portfolio can't be withdrawn before full creation");
    
    portfolio_account.to_be_redeemed = true;
    portfolio_account.withdraw_amount_USDC = _total_amount_USDC;
    
    Ok(())
}
