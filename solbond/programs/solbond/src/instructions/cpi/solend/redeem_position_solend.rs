use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::{PositionAccountSolend, PortfolioAccount};
use crate::utils::seeds;
use spl_token_lending;//::instruction::{deposit_reserve_liquidity}; 
use crate::ErrorCode;

use solana_program::{
    instruction::{AccountMeta, Instruction},
    msg,
    program_error::ProgramError,
    pubkey::{Pubkey, PUBKEY_BYTES},
    sysvar,
};

#[derive(Accounts)]
// #[instruction(amount)]
#[instruction(
    _bump_position: u8,
    _bump_portfolio: u8,
    _bump_ata_liq: u8,
    _bump_ata_col: u8,
    _index: u32,
)]
pub struct RedeemPositionSolend<'info> {

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

    #[account(
        mut,
        seeds = [owner.key().as_ref(),reserve_collateral_mint.key().as_ref(),seeds::TOKEN_ACCOUNT_SEED],
        bump = _bump_ata_col,
    )]
    pub source_collateral: AccountInfo<'info>,
    
    pub liquidity_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [owner.key().as_ref(),liquidity_mint.key().as_ref(),seeds::TOKEN_ACCOUNT_SEED],
        bump = _bump_ata_liq
    )]
    pub destination_liquidity: AccountInfo<'info>,

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
        mut, 
        seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub user_transfer_authority: Box<Account<'info, PortfolioAccount>>,

    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<RedeemPositionSolend>,
    _bump_position: u8,
    _bump_portfolio: u8,
    _bump_ata_liq: u8,
    _bump_ata_col: u8,
    _index: u32,
) -> ProgramResult {
    msg!("Creating a single solend position!");
    msg!("getting portfolio details!");
    
    let position = &mut ctx.accounts.position_pda;

    //let (lending_market_authority_pubkey, _bump_seed) = Pubkey::find_program_address(
    //    &[&ctx.accounts.lending_market.key().to_bytes()[..PUBKEY_BYTES]],
    //    &ctx.accounts.solend_program.key(),
    //);

    // msg!("lending market authority {}", lending_market_authority_pubkey);
    // msg!("solend fucking id {}", ctx.accounts.solend_program.key());

    let ix = spl_token_lending::instruction::redeem_reserve_collateral(
        ctx.accounts.solend_program.key(),
         position.withdraw_amount, 
         ctx.accounts.source_collateral.key(), 
         ctx.accounts.destination_liquidity.key(), 
         ctx.accounts.reserve.key(), 
         ctx.accounts.reserve_collateral_mint.key(), 
         ctx.accounts.reserve_liquidity_supply.key(), 
         ctx.accounts.lending_market.key(), 
         ctx.accounts.user_transfer_authority.to_account_info().key(), // portfolio_pda
    );


    anchor_lang::solana_program::program::invoke_signed(
        &ix,    
        &[
            ctx.accounts.source_collateral.to_account_info(),
            ctx.accounts.destination_liquidity.to_account_info(),
            ctx.accounts.reserve.to_account_info(),
            ctx.accounts.reserve_collateral_mint.to_account_info(),
            ctx.accounts.reserve_liquidity_supply.to_account_info(),
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
    
    // add this stuff in later 
    //approved_position_details.is_fulfilled = true;
    let portfolio = &mut ctx.accounts.user_transfer_authority;
    portfolio.num_redeemed += 1;
    position.is_redeemed = true;

    let owner_acc_info = ctx.accounts.owner.to_account_info();
    let user_starting_lamports = owner_acc_info.lamports();
    let position_acc_info = ctx.accounts.position_pda.to_account_info();
    **owner_acc_info.lamports.borrow_mut() = user_starting_lamports.checked_add(position_acc_info.lamports()).unwrap();
    **position_acc_info.lamports.borrow_mut() = 0;
    let mut position_data = position_acc_info.data.borrow_mut();
    position_data.fill(0);
    
    // let clock = Clock::get().unwrap();
    //approved_position_details.timestamp = clock.unix_timestamp;
    //let portfolio = &mut ctx.accounts.user_transfer_authority;
    //if approved_position_details.index == portfolio.num_positions {
    //    portfolio.fully_created = true;
    //    portfolio.fulfilled_timestamp = clock.unix_timestamp;
    //}

    Ok(())
}
