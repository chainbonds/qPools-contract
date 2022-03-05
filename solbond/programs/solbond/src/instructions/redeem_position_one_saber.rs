use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint, TokenAccount};
use crate::state::{TwoWayPoolAccount, PositionAccountSaber, PortfolioAccount};
use crate::utils::seeds;
use stable_swap_anchor::*;
use stable_swap_anchor::{SwapToken, SwapUserContext, WithdrawOne};
use stable_swap_anchor::StableSwap;


#[derive(Accounts)]
#[instruction(
    _bump_portfolio: u8,
    _bump_position: u8,
    _bump_pool: u8, 
    _index: u32,
)]
pub struct RedeemOneSaberPosition<'info> {
    // doesn't have to be mut
    #[account(
    seeds = [portfolio_owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub portfolio_pda: Account<'info, PortfolioAccount>,

    //#[account(mut)]
    pub portfolio_owner: AccountInfo<'info>,


    pub swap_authority: AccountInfo<'info>,
    #[account(
        seeds = [portfolio_pda.key().as_ref(),
         &_index.to_le_bytes(),seeds::USER_POSITION_STRING.as_bytes(),
        ], 
        bump = _bump_position
    )]
    pub position_pda: Box<Account<'info, PositionAccountSaber>>,

    pub swap: AccountInfo<'info>,

    #[account(
        mut,
        constraint = &input_lp.owner == &portfolio_pda.key(),
    )]
    pub input_lp:  Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub pool_mint: Account<'info, Mint>,


    #[account(
        mut,
        constraint = &user_a.owner == &portfolio_pda.key(),
    )]
    pub user_a: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub reserve_a: Account<'info, TokenAccount>,//Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub fees_a: Box<Account<'info, TokenAccount>>,


    pub mint_a: Account<'info, Mint>,



    #[account(mut)]
    pub reserve_b: Box<Account<'info, TokenAccount>>,


    #[account(
        mut,
        seeds=[pool_mint.key().as_ref(),seeds::TWO_WAY_LP_POOL],
        bump = _bump_pool
    )]
    pub pool_pda: Box<Account<'info, TwoWayPoolAccount>>,


    
    pub saber_swap_program: Program<'info, StableSwap>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,

}


pub fn handler(
    ctx: Context<RedeemOneSaberPosition>,
    _bump_portfolio: u8,
    _bump_position: u8,
    _bump_pool: u8, 
    _index: u32,

) -> ProgramResult {

    msg!("withdraw single saber position");

    let amt_start = ctx.accounts.user_a.amount;
    let user_context: SwapUserContext = SwapUserContext {
        token_program: ctx.accounts.token_program.to_account_info(),
        swap_authority: ctx.accounts.swap_authority.to_account_info(),
        user_authority: ctx.accounts.portfolio_pda.to_account_info(),
        swap: ctx.accounts.swap.to_account_info(),
    };

    let input_a: SwapToken = SwapToken {
        user: ctx.accounts.user_a.to_account_info(),
        reserve: ctx.accounts.reserve_a.to_account_info(),
    };


    let output_a: SwapOutput = SwapOutput {
        user_token: input_a,
        fees: ctx.accounts.fees_a.to_account_info(),
    };



    let withdraw_context: WithdrawOne = WithdrawOne {
       user: user_context,
       input_lp: ctx.accounts.input_lp.to_account_info(),
       pool_mint: ctx.accounts.pool_mint.to_account_info(),
       quote_reserves: ctx.accounts.reserve_b.to_account_info(),
       output: output_a,
    };
    let saber_swap_program = ctx.accounts.saber_swap_program.to_account_info();

    let position = &mut ctx.accounts.position_pda;
    stable_swap_anchor::withdraw_one(
        CpiContext::new_with_signer(
            saber_swap_program,
            withdraw_context,
            &[
                [
                    ctx.accounts.portfolio_owner.key.as_ref(),
                    seeds::PORTFOLIO_SEED,
                    &[_bump_portfolio]
                ].as_ref()
            ]
        ),
        position.pool_token_amount,
        std::cmp::max(
            position.minimum_token_a_amount,
            position.minimum_token_b_amount
        ),
        
    )?;

    msg!("withdraw completed successfully");
  

    Ok(())
}