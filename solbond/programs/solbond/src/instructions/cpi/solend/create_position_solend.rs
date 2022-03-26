use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::{PositionAccountSolend, PortfolioAccount};
use crate::utils::seeds;
use spl_token_lending;//::instruction::{deposit_reserve_liquidity}; 
use crate::ErrorCode;



#[derive(Accounts)]
// #[instruction(amount)]
#[instruction(
    _bump_position: u8,
    _bump_portfolio: u8,
    _index: u32,
)]
pub struct SolendPositionInstruction<'info> {

    #[account(
        mut,
        seeds = [
            owner.key().as_ref(),
            &_index.to_le_bytes(),
            seeds::USER_POSITION_STRING
        ],
        bump = _bump_position,
    )]
    pub position_pda: Box<Account<'info, PositionAccountSolend>>,

    //#[account(mut)]
    pub owner: AccountInfo<'info>,

    #[account(mut)]
    pub source_liquidity: AccountInfo<'info>,

    #[account(mut)]
    pub destination_collateral: AccountInfo<'info>,

    #[account(mut)]
    pub reserve: AccountInfo<'info>,

    #[account(mut)]
    pub reserve_collateral_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub reserve_liquidity_supply: AccountInfo<'info>,

    pub lending_market: AccountInfo<'info>,

    pub lending_market_authority: AccountInfo<'info>,

    // check address of this 
    pub solend_program: AccountInfo<'info>,

    #[account(
        //mut, 
        seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub user_transfer_authority: Box<Account<'info, PortfolioAccount>>,



    //check solend id
    //pub solend_program: AccountInfo<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<SolendPositionInstruction>,
    _bump_position: u8,
    _bump_portfolio: u8,
    _index: u32,
) -> ProgramResult {
    msg!("Creating a single solend position!");
    msg!("getting portfolio details!");
    
    let approved_position_details = &mut ctx.accounts.position_pda;

    //let (lending_market_authority_pubkey, _bump_seed) = Pubkey::find_program_address(
    //    &[&ctx.accounts.lending_market.key().to_bytes()[..PUBKEY_BYTES]],
    //    &ctx.accounts.solend_program.key(),
    //);

    // msg!("lending market authority {}", lending_market_authority_pubkey);
    // msg!("solend fucking id {}", ctx.accounts.solend_program.key());

    let ix = spl_token_lending::instruction::deposit_reserve_liquidity(
        ctx.accounts.solend_program.key(),
         approved_position_details.initial_amount, 
         ctx.accounts.source_liquidity.key(), 
         ctx.accounts.destination_collateral.key(), 
         ctx.accounts.reserve.key(), 
         ctx.accounts.reserve_liquidity_supply.key(), 
         ctx.accounts.reserve_collateral_mint.key(), 
         ctx.accounts.lending_market.key(), 
         ctx.accounts.user_transfer_authority.to_account_info().key(), // portfolio_pda
    );


    anchor_lang::solana_program::program::invoke_signed(
        &ix,    
        &[
            ctx.accounts.source_liquidity.to_account_info(),
            ctx.accounts.destination_collateral.to_account_info(),
            ctx.accounts.reserve.to_account_info(),
            ctx.accounts.reserve_liquidity_supply.to_account_info(),
            ctx.accounts.reserve_collateral_mint.to_account_info(),
            ctx.accounts.lending_market.to_account_info(),
            ctx.accounts.lending_market_authority.to_account_info(), // have to add in context 
            ctx.accounts.user_transfer_authority.to_account_info(),
            ctx.accounts.clock.to_account_info(), // have to add in context
            ctx.accounts.token_program.to_account_info(), // have to add in context
        ],
        &[
            [
                ctx.accounts.owner.key().as_ref(),
                seeds::PORTFOLIO_SEED,
                &[_bump_portfolio]
            ].as_ref()
        ])?;

    approved_position_details.is_fulfilled = true;
    
    let clock = Clock::get().unwrap();
    approved_position_details.timestamp = clock.unix_timestamp;
    let portfolio = &mut ctx.accounts.user_transfer_authority;
    if approved_position_details.index == portfolio.num_positions {
        portfolio.fully_created = true;
        portfolio.fulfilled_timestamp = clock.unix_timestamp;
    }

    Ok(())
}
