use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint, TokenAccount};
use crate::state::{PositionAccountSaber, PortfolioAccount};
use crate::utils::seeds;
use stable_swap_anchor::*;
use stable_swap_anchor::{SwapToken, SwapUserContext, WithdrawOne};
use stable_swap_anchor::StableSwap;
use crate::ErrorCode;

#[derive(Accounts)]
#[instruction(
    _index: u32,
)]
pub struct RedeemOneSaberPosition<'info> {

    #[account(
        mut,
        //seeds = [portfolio_owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub portfolio_pda: Account<'info, PortfolioAccount>,

    //#[account(mut)]
    //pub portfolio_owner: AccountInfo<'info>,

    #[account(mut)]
    pub puller: Signer<'info>,

    pub swap_authority: AccountInfo<'info>,
    #[account(
        mut,
        //seeds = [
        //    portfolio_owner.key().as_ref(),
        //    &_index.to_le_bytes(),
        //    seeds::USER_POSITION_STRING
        //],
        //bump = _bump_position,
    )]
    pub position_pda: Box<Account<'info, PositionAccountSaber>>,

    pub swap: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [portfolio_pda.owner.key().as_ref(),pool_mint.key().as_ref(),seeds::TOKEN_ACCOUNT_SEED],
        bump,
        constraint = &input_lp.owner == &portfolio_pda.key(),
    )]
    pub input_lp:  Box<Account<'info, TokenAccount>>,
    
    #[account(mut)]
    pub pool_mint: Account<'info, Mint>,


    #[account(
        mut,
        seeds = [portfolio_pda.owner.key().as_ref(),mint_a.key().as_ref(),seeds::TOKEN_ACCOUNT_SEED],
        bump,
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


    
    pub saber_swap_program: Program<'info, StableSwap>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,

}


pub fn handler(
    ctx: Context<RedeemOneSaberPosition>,
    _index: u32,

) -> Result<()> {

    if ctx.accounts.portfolio_pda.key() != ctx.accounts.position_pda.portfolio_pda {
        return Err(error!(ErrorCode::ProvidedPortfolioNotMatching));
    }
    if !ctx.accounts.position_pda.redeem_approved {
        return Err(error!(ErrorCode::RedeemNotApproved));
    }
    if ctx.accounts.portfolio_pda.num_redeemed >= ctx.accounts.portfolio_pda.num_positions {
        return Err(error!(ErrorCode::AllPositionsRedeemed));
    }
    if !ctx.accounts.position_pda.is_fulfilled {
        return Err(error!(ErrorCode::PositionNotFulfilledYet));
    }
    if ctx.accounts.position_pda.is_redeemed {
        return Err(error!(ErrorCode::PositionAlreadyRedeemed));

    }


    //let amt_start = ctx.accounts.user_a.amount;
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
                    ctx.accounts.portfolio_pda.owner.key().as_ref(),
                    seeds::PORTFOLIO_SEED,
                    &[ctx.accounts.portfolio_pda.bump]
                ].as_ref()
            ]
        ),
        position.pool_token_amount,
        position.minimum_token_amount_out,
        
    )?;

    let portfolio = &mut ctx.accounts.portfolio_pda;
    portfolio.num_redeemed += 1;
    let position = &mut ctx.accounts.position_pda;
    position.is_redeemed = true;

    // close position account
    // whoever closes this gets the lamports as a bonus for now lol
    let owner_acc_info = ctx.accounts.puller.to_account_info();
    let user_starting_lamports = owner_acc_info.lamports();
    let position_acc_info = ctx.accounts.position_pda.to_account_info();
    **owner_acc_info.lamports.borrow_mut() = user_starting_lamports.checked_add(position_acc_info.lamports()).unwrap();
    **position_acc_info.lamports.borrow_mut() = 0;
    let mut position_data = position_acc_info.data.borrow_mut();
    position_data.fill(0);

    Ok(())
}