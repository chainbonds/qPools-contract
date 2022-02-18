use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use crate::state::{TwoWayPoolAccount, PositionAccount, PortfolioAccount};
use crate::utils::seeds;
use stable_swap_anchor::*;
use stable_swap_anchor::{Deposit, SwapToken, SwapUserContext, WithdrawOne};
use anchor_lang::solana_program::system_program;
use stable_swap_anchor::StableSwap;

//use amm::{self, Tickmap, State, Pool, Tick, Position, PositionList};

#[derive(Accounts)]
// #[instruction(amount)]
#[instruction(
    _bump_portfolio: u8,
    _bump_position: u8,
    _bump_pool: u8, 
    _index: u32,
    mint_amount: u64,
    token_amount: u64,

)]
pub struct RedeemOneSaberPosition<'info> {
    #[account(mut,
    seeds = [portfolio_owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub portfolio_pda: Account<'info, PortfolioAccount>,

    #[account(mut, signer)]
    pub portfolio_owner: AccountInfo<'info>,

    //pub user: AccountInfo<'info>,
    /// The "A" token of the swap.
    //pub input_a: AccountInfo<'info>,
    /// The "B" token of the swap.
    //pub input_b: AccountInfo<'info>,
    /// The pool mint of the swap.
    
    // user: SwapUserContext block 
    pub token_program: AccountInfo<'info>,
    #[account(mut)]
    pub swap_authority: AccountInfo<'info>,
    #[account(
        seeds = [portfolio_owner.key().as_ref(),
        format!("{seed}{index}", seed = seeds::USER_POSITION_STRING, index = _index).as_bytes(),
        ], 
         bump = _bump_position
    )]
    pub position_pda: Box<Account<'info, PositionAccount>>,

    pub swap: AccountInfo<'info>,

    #[account(
        mut,
        //constraint = &input_lp.owner == &position_pda.key(),
    )]
    pub input_lp:  Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub pool_mint: AccountInfo<'info>,

    // output_a: SwapOutput block

    //      user_token: SwapToken  block
    #[account(
        mut,
        //constraint = &user_a.owner == &position_pda.key(),
    )]
    pub user_a: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub reserve_a: AccountInfo<'info>,//Box<Account<'info, TokenAccount>>,
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
    pub system_program: AccountInfo<'info>,

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

/**
    Deposit reserve to pools.
    All the Solana tokens that are within the reserve,
    are now put into
    Frontend should be respondible for creating all the required token accounts!
 */
pub fn handler(
    ctx: Context<RedeemOneSaberPosition>,
    _bump_portfolio: u8,
    _bump_position: u8,
    _bump_pool: u8, 
    _index: u32,
    lp_amount: u64,
    token_amount: u64,

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
        lp_amount,
        token_amount,
        
    )?;

    msg!("withdraw completed successfully");

    let pool_account = &mut ctx.accounts.pool_pda;
    if pool_account.mint_a.key() == ctx.accounts.mint_a.key() {
        msg!("a minus");
        //ool_account.total_amount_in_a -= token_amount;
        pool_account.tmp_a = amt_start;
        pool_account.tmp_b = 0;


    } else {
       // pool_account.total_amount_in_b -= token_amount;
        pool_account.tmp_b = amt_start;
        pool_account.tmp_a = 0;

        msg!("b minus");


    }

    msg!("thru");
    // have to determine which token to withdraw



    

    Ok(())
}