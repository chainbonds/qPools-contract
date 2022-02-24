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

// init_if_needed,
// payer = initializer,
// associated_token::mint = mint_b,
// associated_token::authority = portfolio_pda
// pub associated_token_program: Program<'info, AssociatedToken>
// use anchor_spl::associated_token::{self, AssociatedToken};

#[derive(Accounts)]
// #[instruction(amount)]
#[instruction(
    _bump_pool: u8,
    _bump_position: u8,
    _bump_portfolio: u8,
    _index: u32,
    _weight: u64,
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
        init_if_needed,
        payer = owner,
        space = 8 + PositionAccount::LEN,
        seeds = [owner.key().as_ref(),
        format!("{seed}{index}", seed = seeds::USER_POSITION_STRING, index = _index).as_bytes(),
        ], 
         bump = _bump_position
    )]
    pub position_pda: Box<Account<'info, PositionAccount>>,

    #[account(
        seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,

    #[account(mut, signer)]
    pub owner: AccountInfo<'info>,

  
    /// The output account for LP tokens.
    /// 
    #[account(mut)]
    pub output_lp: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub pool_mint: Box<Account<'info, Mint>>,
    /// The authority of the swap.
    // swap authority doesn't have to be mut, tests pass
    pub swap_authority: AccountInfo<'info>,

    // also doesn't have to be mut, tests pass
    #[account(
        seeds=[pool_mint.key().as_ref(),seeds::TWO_WAY_LP_POOL],
        bump = _bump_pool
    )]
    pub pool_pda: Box<Account<'info, TwoWayPoolAccount>>,
    /// The swap.
    //#[account(mut)]
    pub swap: AccountInfo<'info>,

    // input block
    #[account(
        mut,
        //constraint = &qpools_a.owner == swap_authority.key,
        constraint = &qpools_a.owner == &portfolio_pda.key(),

    )]
    pub qpools_a: Box<Account<'info,TokenAccount>>,

    #[account(mut)]
    pub pool_token_account_a: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub pool_token_account_b: Box<Account<'info, TokenAccount>>,


    #[account(
        mut,
        //constraint = &qpools_b.owner == swap_authority.key
        constraint = &qpools_b.owner == &portfolio_pda.key(),
    )]
    pub qpools_b: Box<Account<'info,TokenAccount>>,

    pub pool_address: AccountInfo<'info>,

    
    pub saber_swap_program: Program<'info, StableSwap>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}


pub fn handler(
    ctx: Context<SaberLiquidityInstruction>,
    _bump_pool: u8,
    _bump_position: u8,
    _bump_portfolio: u8,
    _index: u32,
    _weight: u64,
    token_a_amount: u64,
    token_b_amount: u64,
    min_mint_amount: u64,
) -> ProgramResult {
    msg!("Depositing reserve to pools!");
    msg!("getting portfolio details!");
    let portfolio = &mut ctx.accounts.portfolio_pda;
    assert!(portfolio.weights[_index as usize] == _weight, "input weight does not match portfolio weight!");
    msg!("portfolio weight checks out!");



    let user_context: SwapUserContext = SwapUserContext {
        token_program: ctx.accounts.token_program.to_account_info(),
        swap_authority: ctx.accounts.swap_authority.to_account_info(),
        user_authority: ctx.accounts.portfolio_pda.to_account_info(),
        swap: ctx.accounts.swap.to_account_info(),
    };
    msg!("jshjd reserve to pools!");

    let input_a: SwapToken = SwapToken {
        user: ctx.accounts.qpools_a.to_account_info(),
        reserve: ctx.accounts.pool_token_account_a.to_account_info(),
    };
    msg!("Depositing kkj to pools!");

    let input_b: SwapToken = SwapToken {
        user: ctx.accounts.qpools_b.to_account_info(),
        reserve: ctx.accounts.pool_token_account_b.to_account_info(),
    };
    msg!("Depositing reserve to lal!");

    let deposit_context: Deposit = Deposit {
       user: user_context,
       input_a: input_a,
       input_b: input_b,
       pool_mint: ctx.accounts.pool_mint.to_account_info(),
       output_lp: ctx.accounts.output_lp.to_account_info(),
    };
    let saber_swap_program = ctx.accounts.saber_swap_program.to_account_info();

    msg!("ajsjsj reserve to pools!");

    stable_swap_anchor::deposit(
        CpiContext::new_with_signer(
            saber_swap_program,
            deposit_context,
            &[
                [
                    ctx.accounts.owner.key().as_ref(), 
                    seeds::PORTFOLIO_SEED,
                    &[_bump_portfolio]
                ].as_ref()
            ]
        ),
        token_a_amount,
        token_b_amount,
        min_mint_amount,
    )?;
    msg!("Depositing reskjlsdjklf!");
    msg!("smt{}",ctx.accounts.pool_pda.total_amount_in_a);

    let pool_account = &mut ctx.accounts.pool_pda;
    msg!("got ref");

    pool_account.total_amount_in_a = pool_account.total_amount_in_a.checked_add(token_a_amount).ok_or_else(||{ErrorCode::CustomMathError8})?;
    msg!("a add");

    pool_account.total_amount_in_b = pool_account.total_amount_in_b.checked_add(token_b_amount).ok_or_else(||{ErrorCode::CustomMathError8})?;

    msg!("b add");


    let position_account= &mut ctx.accounts.position_pda;

    position_account.owner = ctx.accounts.owner.key();
    position_account.mint_a = pool_account.mint_a.clone().key();
    position_account.mint_b = pool_account.mint_b.clone().key();
    position_account.mint_lp = pool_account.mint_lp.clone().key();
    position_account.owner_token_account_a = ctx.accounts.qpools_a.key();
    position_account.owner_token_account_b = ctx.accounts.qpools_b.key();
    position_account.owner_token_account_lp = ctx.accounts.output_lp.key();
    position_account.pool_pda = pool_account.key();
    position_account.pool_address = ctx.accounts.pool_address.key();
    position_account.bump = _bump_position;

    let clock = Clock::get().unwrap();
    position_account.timestamp = clock.unix_timestamp;


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