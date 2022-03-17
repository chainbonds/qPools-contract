use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::{PositionAccountLarix, PortfolioAccount};
use crate::utils::seeds;
use stable_swap_anchor::{Deposit, SwapToken, SwapUserContext};
use stable_swap_anchor::StableSwap;
use larix_lending_anchor::accounts::{DepositReserveLiquidity};
use crate::ErrorCode;


/***
 * deposit_reserve_liquidity: c
 * amount: u64, 
 * source_liquidity: user_ATA_for liquidity
 * destinationCollaterl: 
 * 
 * 
 */

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
    _bump_position: u8,
    _bump_portfolio: u8,
    _index: u32,
)]
pub struct LarixPositionInstruction<'info> {

    #[account(
        mut,
        seeds = [
            owner.key().as_ref(),
            &_index.to_le_bytes(),
            seeds::USER_POSITION_STRING
        ],
        bump = _bump_position,
    )]
    pub position_pda: Box<Account<'info, PositionAccountLarix>>,

    // #[account(
    //     mut, 
    //     seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    // )]
    // pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,

    //#[account(mut)]
    pub owner: AccountInfo<'info>,

    #[account(mut)]
    pub source_liquidity: AccountInfo<'info>,

    #[account(mut)]
    pub destination_collateral: AccountInfo<'info>,

    #[account(mut)]
    pub reserve: AccountInfo<'info>,


    pub reserve_collateral_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub reserve_liquidity_supply: AccountInfo<'info>,

    pub lending_market: AccountInfo<'info>,
    pub lending_market_authority:AccountInfo<'info>,

    #[account(
        mut, 
        seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub user_transfer_authority: Box<Account<'info, PortfolioAccount>>,

    //check larix id
    pub larix_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<LarixPositionInstruction>,
    _bump_position: u8,
    _bump_portfolio: u8,
    _index: u32,
) -> ProgramResult {
    msg!("Creating a single saber position!");
    msg!("getting portfolio details!");
    

    let deposit_reserve_liquidity_ctx = DepositReserveLiquidity {
        source_liquidity: ctx.accounts.source_liquidity.to_account_info(),
        destination_collateral: ctx.accounts.desitnation_collateral.to_account_info(),
        reserve: ctx.accounts.reserve.to_account_info(),
        reserve_collateral_mint: ctx.accounts.reserve_collateral_mint.to_account_info(), 
        reserve_liquidity_supply: ctx.accounts.reserve_liquidity_supply.to_account_info(),
        lending_market: ctx.accounts.lending_market.to_account_info(),
        lending_market_authority: ctx.accounts.lending_market_authority.to_account_info(),
        user_transfer_authority: ctx.accounts.user_transfer_authority.to_account_info(),//pda
        token_program: ctx.accounts.token_program.to_account_info(),

    };
    
    let larix_program = ctx.accounts.larix_program.to_account_info();

    let approved_position_details = &mut ctx.accounts.position_pda;

    larix_lending_anchor::deposit_reserve_liquidity(
        CpiContext::new_with_signer(
            larix_program,
            deposit_reserve_liquidity_ctx,
            &[
                [
                    ctx.accounts.owner.key().as_ref(),
                    seeds::PORTFOLIO_SEED,
                    &[_bump_portfolio]
                ].as_ref()
            ]
        ),
        approved_position_details.initial_amount,

    )?;

    approved_position_details.is_fulfilled = true;
    
    let clock = Clock::get().unwrap();
    approved_position_details.timestamp = clock.unix_timestamp;
    let portfolio = &mut ctx.accounts.portfolio_pda;
    if approved_position_details.index == portfolio.num_positions {
        portfolio.fully_created = true;
        portfolio.fulfilled_timestamp = clock.unix_timestamp;
    }

    Ok(())
}
