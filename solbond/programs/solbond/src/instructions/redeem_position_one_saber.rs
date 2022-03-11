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
    _bump_portfolio: u8,
    _bump_position: u8,
    //_bump_pool: u8, 
    _index: u32,
)]
pub struct RedeemOneSaberPosition<'info> {
    // doesn't have to be mut
    #[account(
    mut,
    seeds = [portfolio_owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub portfolio_pda: Account<'info, PortfolioAccount>,

    //#[account(mut)]
    pub portfolio_owner: AccountInfo<'info>,


    pub swap_authority: AccountInfo<'info>,
    #[account(
        mut,
        // seeds = [portfolio_owner.key().as_ref(),
        //  //&_index.to_le_bytes(),seeds::USER_POSITION_STRING,
        //  format!("{index}{seed}", index = _index, seed = seeds::USER_POSITION_STRING).as_bytes(),
        // ],
        // bump = _bump_position
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


    
    pub saber_swap_program: Program<'info, StableSwap>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,

}


pub fn handler(
    ctx: Context<RedeemOneSaberPosition>,
    _bump_portfolio: u8,
    _bump_position: u8,
    _index: u32,

) -> ProgramResult {

    msg!("withdraw single saber position");
    if !ctx.accounts.position_pda.redeem_approved {
        return Err(ErrorCode::RedeemNotApproved.into());
    }
    if ctx.accounts.portfolio_pda.num_redeemed >= ctx.accounts.portfolio_pda.num_positions {
        return Err(ErrorCode::AllPositionsRedeemed.into());
    }
    if !ctx.accounts.position_pda.is_fulfilled {
        return Err(ErrorCode::PositionNotFulfilledYet.into());
    }
    if ctx.accounts.position_pda.is_redeemed {
        return Err(ErrorCode::PositionAlreadyRedeemed.into());

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
                    ctx.accounts.portfolio_owner.key.as_ref(),
                    seeds::PORTFOLIO_SEED,
                    &[_bump_portfolio]
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

    msg!("withdraw completed successfully");
  

    Ok(())
}