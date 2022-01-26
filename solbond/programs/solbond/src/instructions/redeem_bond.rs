use std::fmt::Error;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

use crate::ErrorCode;
use crate::state::{BondPoolAccount, TvlInfoAccount};
use crate::utils::functional::calculate_currency_token_to_be_distributed;
use crate::utils::seeds;

/*

    TODO 1:
        Move some of the profits in both cases to the generator / initiator of the bond_pool_account (owner)

    TODO 2:
        Make checks whenever there is a division for division by zero, etc.

*/

// TODO: Update the number of tokens in the struct, after it was paid out
// TODO: How does this work with estimating how much solana to pay out,
// and re-structuring the reserve

/**
 * Returns everything that is owned as redeemables.
 * Account will not include any more redeemables after this!
 * There is no need to update the redeemables after this, because of this
 */

// lol this is identical to BuyBond :P
#[derive(Accounts)]
#[instruction(
reedemable_amount_in_lamports: u64,
_bump_tvl_account: u8
)]
pub struct RedeemBond<'info> {

    // Any Bond Pool Accounts
    #[account(mut)]
    pub bond_pool_account: Box<Account<'info, BondPoolAccount>>,
    #[account(
        mut,
        // constraint = bond_pool_redeemable_mint.mint_authority == COption::Some(bond_pool_account.key())
    )]
    pub bond_pool_redeemable_mint: Account<'info, Mint>,

    // not sure right now if this has to be mutable
    // inspired by the ido_pool program
    #[account(mut)]
    pub bond_pool_currency_token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub bond_pool_currency_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub bond_pool_redeemable_token_account: Account<'info, TokenAccount>,

    #[account(signer, mut)]
    pub purchaser: AccountInfo<'info>,
    #[account(mut, constraint = purchaser_redeemable_token_account.owner == purchaser.key())]
    pub purchaser_redeemable_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut, constraint = purchaser_currency_token_account.owner == purchaser.key())]
    pub purchaser_currency_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        seeds = [bond_pool_account.key().as_ref(), seeds::TVL_INFO_ACCOUNT],
        bump = _bump_tvl_account
    )]
    pub tvl_account: Account<'info, TvlInfoAccount>,

    // The standard accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<RedeemBond>,
    redeemable_amount_raw: u64,
    _bump_tvl_account: u8
) -> ProgramResult {
    msg!("SOLBOND: REDEEM_BOND");

    if redeemable_amount_raw <= 0 {
        return Err(ErrorCode::LowBondRedeemableAmount.into());
    }

    // TODO: Double check that the user actually has less than this in their amount
    let mut total_redeemable_supply: u128 = ctx.accounts.bond_pool_redeemable_mint.supply as u128;
    // let total_currency_token_supply: u64 = ctx.accounts.bond_pool_currency_token_account.amount;
    let mut total_currency_token_supply: u128 = ctx.accounts.tvl_account.tvl_in_usdc as u128;
    let redeemable_amount_raw: u128 = redeemable_amount_raw as u128;

    // TODO, these are not total supplies, but amounts for this pool
    // Actually, these are total supplies

    if total_redeemable_supply == 0 {
        return Err(ErrorCode::EmptyTotalTokenSupply.into());
    }
    if total_currency_token_supply == 0 {
        return Err(ErrorCode::EmptyTotalCurrencySupply.into());
    }

    let currency_decimals: u128 = 10_i32.checked_pow(ctx.accounts.tvl_account.decimals as u32).ok_or_else( | | {ErrorCode::CustomMathError15})? as u128;
    let redeemables_decimals: u128 = 10_i32.checked_pow(ctx.accounts.bond_pool_redeemable_mint.decimals as u32).ok_or_else( | | {ErrorCode::CustomMathError16})? as u128;

    msg!("deimals ctx is: {}", ctx.accounts.bond_pool_redeemable_mint.decimals);
    msg!("deimals converted is: {}", ctx.accounts.bond_pool_redeemable_mint.decimals as u32);

    msg!("Redeemable decimals before are: {}", redeemables_decimals);
    total_redeemable_supply = total_redeemable_supply.checked_mul(currency_decimals).ok_or_else( | | {ErrorCode::CustomMathError17})?;
    total_currency_token_supply = total_currency_token_supply.checked_mul(redeemables_decimals).ok_or_else( | | {ErrorCode::CustomMathError18})?;
    let exponential_redeemable_amount_raw = redeemable_amount_raw.checked_mul(currency_decimals).ok_or_else( | | {ErrorCode::CustomMathError19})?;
    msg!("Redeemable decimals after multi are: {}", redeemables_decimals);
    /*
    * Step 1: Calculate Market Rate
    *    How many SOL, per redeemable to distribute
    */
    msg!("Inputs are");
    msg!("{}", total_currency_token_supply);
    msg!("{}", total_redeemable_supply);
    msg!("{}", exponential_redeemable_amount_raw);

    let _currency_token_to_be_distributed: u128;
    match calculate_currency_token_to_be_distributed(
        total_currency_token_supply,
        total_redeemable_supply,
        exponential_redeemable_amount_raw
    ) {
        Ok(x) => {
            _currency_token_to_be_distributed = x;
        },
        Err(error) => {
            return Err(error.into());
        }
    }

    msg!("Total amount items are: ");
    msg!("{}", _currency_token_to_be_distributed);
    msg!("{}", redeemables_decimals);
    let currency_token_to_be_distributed: u64 = _currency_token_to_be_distributed.checked_div(redeemables_decimals).ok_or_else( | | {ErrorCode::CustomMathError20})? as u64;
    msg!("{}", currency_token_to_be_distributed);

    if currency_token_to_be_distributed == 0 {
        return Err(ErrorCode::ReturningNoCurrency.into());
    }
    msg!("currency_token_to_be_distributed");
    msg!(&currency_token_to_be_distributed.to_string());
    msg!("total_currency_token_supply");
    msg!(&total_currency_token_supply.to_string());
    msg!("total_redeemable_supply");
    msg!(&total_redeemable_supply.to_string());
    msg!("redeemable_amount_raw");
    msg!(&exponential_redeemable_amount_raw.to_string());

    /*
     * Step 2: Burn Bond Token
     */
    let cpi_accounts = Burn {
        mint: ctx.accounts.bond_pool_redeemable_mint.to_account_info(),
        to: ctx.accounts.purchaser_redeemable_token_account.to_account_info(),
        authority: ctx.accounts.purchaser.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    token::burn(
        CpiContext::new_with_signer(
            cpi_program,
            cpi_accounts,
    &[[
                    ctx.accounts.bond_pool_currency_token_mint.key().as_ref(), seeds::BOND_POOL_ACCOUNT,
                    &[ctx.accounts.bond_pool_account.bump_bond_pool_account]
                ].as_ref()
            ],
        ),
        redeemable_amount_raw as u64,
    )?;

    /*
     * Step 3: Transfer what the reserve generated back
     */
    msg!("Helloo");
    let cpi_accounts = Transfer {
        from: ctx.accounts.bond_pool_currency_token_account.to_account_info(),
        to: ctx.accounts.purchaser_currency_token_account.to_account_info(),
        authority: ctx.accounts.bond_pool_account.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    token::transfer(
        CpiContext::new_with_signer(
            cpi_program,
            cpi_accounts,
            &[[
                ctx.accounts.bond_pool_currency_token_mint.key().as_ref(), seeds::BOND_POOL_ACCOUNT,
                &[ctx.accounts.bond_pool_account.bump_bond_pool_account]
            ].as_ref()],
        ), currency_token_to_be_distributed as u64)?;


    Ok(())
}


