use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use crate::state::{TwoWayPoolAccount, PositionAccount, PortfolioAccount};
use crate::utils::seeds;
use stable_swap_anchor::*;
use stable_swap_anchor::{Deposit, SwapToken, SwapUserContext};
use anchor_lang::solana_program::system_program;
use stable_swap_anchor::StableSwap;
use crate::ErrorCode;
//use amm::{self, Tickmap, State, Pool, Tick, Position, PositionList};

#[derive(Accounts)]
// #[instruction(amount)]
#[instruction(
    _bump_pool: u8, 
)]
pub struct UpdatePoolStruct<'info> {

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


    #[account(
        mut,
        seeds=[pool_mint.key().as_ref(),seeds::TWO_WAY_LP_POOL],
        bump = _bump_pool
    )]
    pub pool_pda: Box<Account<'info, TwoWayPoolAccount>>,

    #[account(mut)]
    pub pool_mint: AccountInfo<'info>,
    // output_a: SwapOutput block

    //      user_token: SwapToken  block
    #[account(
        mut,
        //constraint = &user_a.owner == &position_pda.key(),
    )]
    pub user_a: Box<Account<'info, TokenAccount>>,


    #[account(
        mut,
        //constraint = &user_b.owner == &position_pda.key(),
    )]
    pub user_b: Box<Account<'info, TokenAccount>>,

    pub system_program: AccountInfo<'info>,

}
#[derive(Accounts)]
#[instruction(
    _bump_portfolio: u8,
    _bump_position: u8,
    _bump_pool: u8, 
    _index: u32,
    min_mint_amount: u64,
    token_a_amount: u64,
    token_b_amount: u64
)]
pub struct RedeemSaberPosition<'info> {
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
        seeds=[pool_mint.key().as_ref(),seeds::TWO_WAY_LP_POOL],
        bump = _bump_pool
    )]
    pub pool_pda: Box<Account<'info, TwoWayPoolAccount>>,

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


    // output_b: SwapOutput block

    //      user_token: SwapToken  block
    #[account(
        mut,
        //constraint = &user_b.owner == &position_pda.key(),
    )]
    pub user_b: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub reserve_b: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub fees_b: Box<Account<'info, TokenAccount>>,



    
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
    ctx: Context<RedeemSaberPosition>,
    _bump_portfolio: u8,
    _bump_position: u8,
    _bump_pool: u8, 
    _index: u32,
    min_mint_amount: u64,
    token_a_amount: u64,
    token_b_amount: u64
) -> ProgramResult {
    
    msg!("withdraw single saber position");

    let amt_start_a = ctx.accounts.user_a.amount;
    let amt_start_b = ctx.accounts.user_b.amount;

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

    let input_b: SwapToken = SwapToken {
        user: ctx.accounts.user_b.to_account_info(),
        reserve: ctx.accounts.reserve_b.to_account_info(),
    };

    let output_a: SwapOutput = SwapOutput {
        user_token: input_a,
        fees: ctx.accounts.fees_a.to_account_info(),
    };

    let output_b: SwapOutput = SwapOutput {
        user_token: input_b,
        fees: ctx.accounts.fees_b.to_account_info(),
    };

    let withdraw_context: Withdraw = Withdraw {
       user: user_context,
       input_lp: ctx.accounts.input_lp.to_account_info(),
       pool_mint: ctx.accounts.pool_mint.to_account_info(),
       output_a: output_a,
       output_b: output_b,
    };
    let saber_swap_program = ctx.accounts.saber_swap_program.to_account_info();


    stable_swap_anchor::withdraw(
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
        min_mint_amount,
        token_a_amount,
        token_b_amount,
        
    )?;
    

    let pool_account = &mut ctx.accounts.pool_pda;
    pool_account.tmp_a = amt_start_a;
    pool_account.tmp_b = amt_start_b;
 
    

    Ok(())
}

pub fn update_balance(ctx: Context<UpdatePoolStruct>,
    _bump_pool: u8, 
    ) -> ProgramResult {

        let pool_account = &mut ctx.accounts.pool_pda;

        
        let amt_after_a = ctx.accounts.user_a.amount;
        let amt_after_b = ctx.accounts.user_b.amount;
        msg!(&format!("tmp A  is {}", pool_account.tmp_a));
        msg!(&format!("tmp B  is {}", pool_account.tmp_b));
        msg!(&format!("AFTER A  is {}", amt_after_a));
        msg!(&format!("AFTER B  is {}", amt_after_b));

        let diff_a = amt_after_a.checked_sub(pool_account.tmp_a).ok_or_else(||{ErrorCode::CustomMathError6})?;
        let diff_b = amt_after_b.checked_sub(pool_account.tmp_b).ok_or_else(||{ErrorCode::CustomMathError6})?;
        let pool_account = &mut ctx.accounts.pool_pda;
        msg!("got ref");

        msg!(&format!("Amount A before is {}", pool_account.total_amount_in_a));
        msg!(&format!("Amount to subtract {}", diff_a));
        if pool_account.total_amount_in_a > 0 {
            if diff_a <= pool_account.total_amount_in_a {
                pool_account.total_amount_in_a = pool_account.total_amount_in_a.checked_sub(diff_a).ok_or_else(||{ErrorCode::CustomMathError6})?;

            } else {
                pool_account.total_amount_in_a = 0
            }
        }
        msg!(&format!("Amount A after is {}", pool_account.total_amount_in_a));

        msg!("a minus");
        msg!(&format!("Amount B before is {}", pool_account.total_amount_in_b));
        msg!(&format!("Amount to subtract {}", diff_b));
        if pool_account.total_amount_in_b > 0 {
            if diff_b <= pool_account.total_amount_in_b {
                pool_account.total_amount_in_b = pool_account.total_amount_in_b.checked_sub(diff_b).ok_or_else(||{ErrorCode::CustomMathError6})?;

            } else {
                pool_account.total_amount_in_b = 0
            }
        }
        // pool_account.total_amount_in_b -= diff_b;
        msg!(&format!("Amount B after is {}", pool_account.total_amount_in_b));
        Ok(())
}