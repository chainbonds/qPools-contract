use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use crate::state::{TwoWayPoolAccount, PositionAccount};
use crate::utils::seeds;
use stable_swap_anchor::*;
use stable_swap_anchor::{Deposit, SwapToken, SwapUserContext};
use anchor_lang::solana_program::system_program;
use stable_swap_anchor::StableSwap;

//use amm::{self, Tickmap, State, Pool, Tick, Position, PositionList};

#[derive(Accounts)]
// #[instruction(amount)]
#[instruction(
    _bump_pool: u8,
    _bump_position: u8,
    token_a_amount: u64,
    token_b_amount: u64,
    min_mint_amount: u64,
)]
pub struct SaberLiquidityInstruction<'info> {

    //pub user: AccountInfo<'info>,
    /// The "A" token of the swap.
    //pub input_a: AccountInfo<'info>,
    /// The "B" token of the swap.
    //pub input_b: AccountInfo<'info>,
    /// The pool mint of the swap.
    /// 
    /// 
    /// 
    
    #[account(
        init,
        payer = owner,
        space = 8 + PositionAccount::LEN,
        seeds = [owner.key().as_ref(), seeds::USER_POSITION_ACCOUNT], bump = _bump_position
    )]
    pub position_pda: Account<'info, PositionAccount>,

    #[account(signer)]
    pub owner: AccountInfo<'info>,

  
    /// The output account for LP tokens.
    /// 
    #[account(mut)]
    pub output_lp: Account<'info, TokenAccount>,

    pub pool_mint: Account<'info, Mint>,
    /// The authority of the swap.
    #[account(mut)]
    pub swap_authority: AccountInfo<'info>,
    /// The authority of the user.
    //#[account(mut, signer)]
    #[account(
        seeds=[pool_mint.key().as_ref(),seeds::TWO_WAY_LP_POOL ],
        bump = _bump_pool
    )]
    pub pool_pda: Account<'info, TwoWayPoolAccount>,
    /// The swap.
    //#[account(mut)]
    pub swap: AccountInfo<'info>,

    // input block
    #[account(
        mut,
        //constraint = &qPools_a.owner == pool_pda.key(),
    )]
    pub qpools_a: Box<Account<'info,TokenAccount>>,

    #[account(mut)]
    pub pool_token_account_a: Account<'info, TokenAccount>,

    #[account(mut)]
    pub pool_token_account_b: Account<'info, TokenAccount>,


    #[account(
        mut,
        //constraint = &qPools_b.owner == pool_pda.key()
    )]
    pub qpools_b: Box<Account<'info,TokenAccount>>,

    
    pub saber_swap_program: Program<'info, StableSwap>,
    
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

/**
    Deposit reserve to pools.
    All the Solana tokens that are within the reserve,
    are now put into
    Frontend should be respondible for creating all the required token accounts!
 */
pub fn handler(
    ctx: Context<SaberLiquidityInstruction>,
    _bump_pool: u8,
    _bump_position: u8,
    token_a_amount: u64,
    token_b_amount: u64,
    min_mint_amount: u64,
) -> ProgramResult {
    msg!("Depositing reserve to pools!");


    let user_context: SwapUserContext = SwapUserContext {
        token_program: ctx.accounts.token_program.to_account_info(),
        swap_authority: ctx.accounts.swap_authority.to_account_info(),
        user_authority: ctx.accounts.pool_pda.to_account_info(),
        swap: ctx.accounts.swap.to_account_info(),
    };

    let input_a: SwapToken = SwapToken {
        user: ctx.accounts.qpools_a.to_account_info(),
        reserve: ctx.accounts.pool_token_account_a.to_account_info(),
    };

    let input_b: SwapToken = SwapToken {
        user: ctx.accounts.qpools_b.to_account_info(),
        reserve: ctx.accounts.pool_token_account_b.to_account_info(),
    };

    let deposit_context: Deposit = Deposit {
       user: user_context,
       input_a: input_a,
       input_b: input_b,
       pool_mint: ctx.accounts.pool_mint.to_account_info(),
       output_lp: ctx.accounts.output_lp.to_account_info(),
    };
    let saber_swap_program = ctx.accounts.saber_swap_program.to_account_info();


    stable_swap_anchor::deposit(
        CpiContext::new_with_signer(
            saber_swap_program,
            deposit_context,
            &[
                [
                    ctx.accounts.pool_mint.key().as_ref(), seeds::TWO_WAY_LP_POOL,
                    &[_bump_pool]
                ].as_ref()
            ]
        ),
        token_a_amount,
        token_b_amount,
        min_mint_amount,
    )?;


    let pool_account = &mut ctx.accounts.pool_pda;
    pool_account.total_amount_in_a += token_a_amount;
    pool_account.total_amount_in_b += token_b_amount;


    let position_account= &mut ctx.accounts.position_pda;
    position_account.owner = ctx.accounts.owner.key();
    position_account.mint_a = pool_account.mint_a.clone().key();
    position_account.mint_b = pool_account.mint_b.clone().key();
    position_account.mint_lp = pool_account.mint_lp.clone().key();
    position_account.owner_token_account_a = ctx.accounts.qpools_a.key();
    position_account.owner_token_account_b = ctx.accounts.qpools_b.key();
    position_account.owner_token_account_lp = ctx.accounts.output_lp.key();
    position_account.pool_pda = pool_account.key();
    position_account.bump = _bump_position;


    // // Calculate how much currency is in the bond
    // let available_currency: u64 = ctx.accounts.bond_pool_currency_account.amount;
    //
    // // For now, assume we provide the same amount of liquidity to all pools
    // // So we don't have to calculate the weightings
    // let fraction_per_pool = calculate_amount_per_pool(available_currency);
    //
    // // Make swaps, and deposit this much to the pool
    // for i in 0..fraction_per_pool.len() {
    //
    // }

    Ok(())
}