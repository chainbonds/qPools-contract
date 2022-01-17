use std::fmt::Error;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

use crate::ErrorCode;
use crate::state::BondPoolAccount;
use crate::utils::functional::calculate_currency_token_to_be_distributed;

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
)]
pub struct RedeemBond<'info> {

    // Any Bond Pool Accounts
    #[account(mut)]
    pub bond_pool_account: Account<'info, BondPoolAccount>,
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

    // The standard accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<RedeemBond>,
    redeemable_amount_raw: u64
) -> ProgramResult {
    msg!("SOLBOND: REDEEM_BOND");

    if redeemable_amount_raw <= 0 {
        return Err(ErrorCode::LowBondRedeemableAmount.into());
    }

    // TODO: Double check that the user actually has less than this in their amount
    let total_redeemable_supply: u64 = ctx.accounts.bond_pool_redeemable_mint.supply;
    let total_currency_token_supply: u64 = ctx.accounts.bond_pool_currency_token_account.amount;

    // TODO, these are not total supplies, but amounts for this pool
    // Actually, these are total supplies

    if total_redeemable_supply == 0 {
        return Err(ErrorCode::EmptyTotalTokenSupply.into());
    }

    /*
    * Step 1: Calculate Market Rate
    *    How many SOL, per redeemable to distribute
    */
    let currency_token_to_be_distributed: u64;
    match calculate_currency_token_to_be_distributed(
        total_currency_token_supply,
        total_redeemable_supply,
        redeemable_amount_raw
    ) {
        Ok(x) => {
            currency_token_to_be_distributed = x;
        },
        Err(error) => {
            return Err(error.into());
        }
    }

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
    msg!(&redeemable_amount_raw.to_string());

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
                    ctx.accounts.bond_pool_currency_token_mint.key().as_ref(), b"bondPoolAccount1",
                    &[ctx.accounts.bond_pool_account.bump_bond_pool_account]
                ].as_ref()
            ],
        ),
        redeemable_amount_raw,
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
                ctx.accounts.bond_pool_currency_token_mint.key().as_ref(), b"bondPoolAccount1",
                &[ctx.accounts.bond_pool_account.bump_bond_pool_account]
            ].as_ref()],
        ), currency_token_to_be_distributed)?;


    Ok(())
}
