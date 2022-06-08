use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::{PositionAccountSaber, PortfolioAccount};
use crate::utils::seeds;
use stable_swap_anchor::{Deposit, SwapToken, SwapUserContext};
use stable_swap_anchor::StableSwap;
use crate::ErrorCode;
use std::cmp;

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
    _index: u32
)]
pub struct SaberLiquidityInstruction<'info> {

    #[account(
        mut,
        //seeds = [
        //    owner.key().as_ref(),
        //    &_index.to_le_bytes(),
        //    seeds::USER_POSITION_STRING
        //],
        //bump = _bump_position,
    )]
    pub position_pda: Box<Account<'info, PositionAccountSaber>>,

    #[account(
        mut, 
        //seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,

    //#[account(mut)]
    //pub owner: AccountInfo<'info>,
    
    #[account(mut)]
    pub puller: Signer<'info>,

  
    /// The output account for LP tokens.
    /// 
    #[account(
        init_if_needed,
        payer = puller,
        token::mint = pool_mint,
        token::authority = portfolio_pda,
        seeds = [portfolio_pda.owner.key().as_ref(),pool_mint.key().as_ref(),seeds::TOKEN_ACCOUNT_SEED],
        bump,
    )]
    pub output_lp: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub pool_mint: Box<Account<'info, Mint>>,
    /// The authority of the swap.
    // swap authority doesn't have to be mut, tests pass
    /// CHECK: checked by saber
    pub swap_authority: AccountInfo<'info>,

    /// The swap.
    //#[account(mut)]approved_position_details
    /// CHECK: checked by saber
    pub swap: AccountInfo<'info>,

    pub mint_a: Account<'info,Mint>,
    // input block
    #[account(
        init_if_needed,
        payer = puller,
        token::mint = mint_a,
        token::authority = portfolio_pda,
        seeds = [portfolio_pda.owner.key().as_ref(),mint_a.key().as_ref(),seeds::TOKEN_ACCOUNT_SEED],
        bump,
        constraint = &qpools_a.owner == &portfolio_pda.key(),

    )]
    pub qpools_a: Box<Account<'info,TokenAccount>>,

    #[account(mut)]
    pub pool_token_account_a: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub pool_token_account_b: Box<Account<'info, TokenAccount>>,

    pub mint_b: Account<'info,Mint>,

    #[account(
        init_if_needed,
        payer = puller,
        token::mint = mint_b,
        token::authority = portfolio_pda,
        seeds = [portfolio_pda.owner.key().as_ref(),mint_b.key().as_ref(),seeds::TOKEN_ACCOUNT_SEED],
        bump,
        constraint = &qpools_b.owner == &portfolio_pda.key(),
    )]
    pub qpools_b: Box<Account<'info,TokenAccount>>,
    
    pub saber_swap_program: Program<'info, StableSwap>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<SaberLiquidityInstruction>,
    _index: u32,
) -> Result<()> {

    if ctx.accounts.portfolio_pda.key() != ctx.accounts.position_pda.portfolio_pda {
        return Err(error!(ErrorCode::ProvidedPortfolioNotMatching));
    }
    if ctx.accounts.position_pda.is_fulfilled {
        return Err(error!(ErrorCode::PositionAlreadyFulfilledError));
    }
    if ctx.accounts.position_pda.index > ctx.accounts.portfolio_pda.num_positions || ctx.accounts.portfolio_pda.fully_created {
        return Err(error!(ErrorCode::PositionFullyCreatedError));
    }
    if ctx.accounts.pool_mint.key() != ctx.accounts.position_pda.pool_address {
        return Err(error!(ErrorCode::ProvidedMintNotMatching));
    }
  
    let user_context: SwapUserContext = SwapUserContext {
        token_program: ctx.accounts.token_program.to_account_info(),
        swap_authority: ctx.accounts.swap_authority.to_account_info(),
        user_authority: ctx.accounts.portfolio_pda.to_account_info(),
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

    let approved_position_details = &mut ctx.accounts.position_pda;

    // Will print out the user's balance

    // TODO: Make take the min between tokenamount and max initial token amount ?

    stable_swap_anchor::deposit(
        CpiContext::new_with_signer(
            saber_swap_program,
            deposit_context,
            &[
                [
                    ctx.accounts.portfolio_pda.owner.key().as_ref(),
                    seeds::PORTFOLIO_SEED,
                    &[ctx.accounts.portfolio_pda.bump]
                ].as_ref()
            ]
        ),
        approved_position_details.max_initial_token_a_amount,
        approved_position_details.max_initial_token_b_amount,
        approved_position_details.min_mint_amount,
    )?;

    approved_position_details.is_fulfilled = true;
    
    let clock = Clock::get().unwrap();
    approved_position_details.timestamp = clock.unix_timestamp;
    let portfolio = &mut ctx.accounts.portfolio_pda;
    portfolio.num_created += 1;
    if portfolio.num_created >= portfolio.num_positions {
        portfolio.fully_created = true;
        portfolio.fulfilled_timestamp = clock.unix_timestamp;
    }

    Ok(())
}
