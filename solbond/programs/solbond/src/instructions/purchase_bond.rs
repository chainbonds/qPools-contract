use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

use crate::ErrorCode;
use crate::state::{BondPoolAccount, TvlInfoAccount};
use crate::utils::functional::calculate_redeemables_to_be_distributed;
use crate::utils::seeds;

#[derive(Accounts)]
#[instruction(
    currency_token_amount_raw: u64,
    _bump_tvl_account: u8
)]
pub struct PurchaseBond<'info> {

    // All Bond Pool Accounts
    #[account(mut)]
    pub bond_pool_account: Box<Account<'info, BondPoolAccount>>,

    #[account(
        mut,
        constraint = bond_pool_redeemable_mint.mint_authority == COption::Some(bond_pool_account.key())
    )]
    pub bond_pool_redeemable_mint: Account<'info, Mint>,

    #[account(mut)]
    pub bond_pool_currency_token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub bond_pool_currency_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub bond_pool_redeemable_token_account: Account<'info, TokenAccount>,

    #[account(
        seeds = [bond_pool_account.key().as_ref(), seeds::TVL_INFO_ACCOUNT],
        bump = _bump_tvl_account
    )]
    pub tvl_account: Account<'info, TvlInfoAccount>,

    // All Purchaser Accounts
    #[account(signer, mut)]
    pub purchaser: AccountInfo<'info>,
    #[account(mut)]
    pub purchaser_currency_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub purchaser_redeemable_token_account: Box<Account<'info, TokenAccount>>,

    // The standard accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

/* TODO: Can Implement this once the need is there, and refactoring makes sense
impl<'info> TakeTokens<'info> for Swap<'info> {
    fn pay_in_reserve
}
*/

pub fn handler(
    ctx: Context<PurchaseBond>,
    currency_token_amount_raw: u64,
    _bump_tvl_account: u8
) -> ProgramResult {


    if currency_token_amount_raw <= 0 {
        return Err(ErrorCode::LowBondTokAmount.into());
    }
    msg!("Currency amount is: {}", currency_token_amount_raw);
    if ctx.accounts.purchaser_currency_token_account.amount < currency_token_amount_raw {
        return Err(ErrorCode::MinPurchaseAmount.into());
    }
    /*
    * Step 1: Calculate Market Rate
    *    How many redeemables, per solana to distribute
    *    If the reserve is empty as of now, fixate 1 Token to be equal to 1 SOL
    *    R_T/S_T = P is a constant
    *    X is the number of tokens to mint,
    *    S_0 is total amount of SOL in pool, R_0 is total number of tokens minted so far
    *    S_in is how much user is putting into the pool
    *    P = (R_0 + X)/(S_0 + S_in) ==> X = (S_0 + S_in)*P - R_0
    */
    // TODO: Double check that the user actually has less than this in their amount
    let total_redeemable_supply: u128 = ctx.accounts.bond_pool_redeemable_mint.supply as u128;
    // let total_currency_token_supply: u64 = ctx.accounts.bond_pool_currency_token_account.amount;
    let total_currency_token_supply: u128 = ctx.accounts.tvl_account.tvl_in_usdc as u128;
    let currency_token_amount_raw: u128 = currency_token_amount_raw as u128;

    let currency_decimals: u128 = 10_i32.checked_pow(ctx.accounts.tvl_account.decimals as u32).ok_or_else( | | {ErrorCode::CustomMathError9})? as u128;
    let redeemables_decimals: u128 = 10_i32.checked_pow(ctx.accounts.bond_pool_redeemable_mint.decimals as u32).ok_or_else( | | {ErrorCode::CustomMathError10})? as u128;

    // Normalize to the same decimals, before proceeding with calculations ...
    total_redeemable_supply.checked_mul(currency_decimals).ok_or_else( | | {ErrorCode::CustomMathError11})?;
    total_currency_token_supply.checked_mul(redeemables_decimals).ok_or_else( | | {ErrorCode::CustomMathError12})?;
    currency_token_amount_raw.checked_mul(redeemables_decimals).ok_or_else( | | {ErrorCode::CustomMathError13})?;

    // checked in function, looks correct
    let _redeemable_to_be_distributed: u128;
    match calculate_redeemables_to_be_distributed(
        total_currency_token_supply,
        total_redeemable_supply,
        currency_token_amount_raw
    ) {
        Ok(x) => {
            _redeemable_to_be_distributed = x;
        },
        Err(error) => {
            return Err(error.into());
        }
    }

    // De-normalize again ...
    let redeemable_to_be_distributed: u64 = _redeemable_to_be_distributed.checked_div(currency_decimals).ok_or_else( | | {ErrorCode::CustomMathError14})? as u64;

    /*
     * Step 2: Transfer SOL to the bond's reserve
     */
    // Checking if there was an infinite amount
    // if amount_in_redeemables.is_infinite() {
    //     return Err(Error::MarketRateOverflow.into());
    // }
    // this needs to become a normal token transfer now.

    // Transfer user's token to pool token account.
    let cpi_accounts = Transfer {
        from: ctx.accounts.purchaser_currency_token_account.to_account_info(),
        to: ctx.accounts.bond_pool_currency_token_account.to_account_info(),
        authority: ctx.accounts.purchaser.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, currency_token_amount_raw as u64)?;

    /*
     * Step 3: Mint new redeemables to the user to keep track of how much he has paid in in total
     * We just mint to the user now lol
     */
    let cpi_accounts = MintTo {
        mint: ctx.accounts.bond_pool_redeemable_mint.to_account_info(),
        to: ctx.accounts.purchaser_redeemable_token_account.to_account_info(),
        authority: ctx.accounts.bond_pool_account.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    token::mint_to(
        CpiContext::new_with_signer(
            cpi_program,
            cpi_accounts,
            &[[
                ctx.accounts.bond_pool_currency_token_mint.key().as_ref(), seeds::BOND_POOL_ACCOUNT,
                &[ctx.accounts.bond_pool_account.bump_bond_pool_account]
            ].as_ref()],
        ),
        redeemable_to_be_distributed as u64,
    )?;

    Ok(())
}