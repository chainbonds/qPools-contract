use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Transfer};

use crate::{
    ErrorCode,
    RedeemBond
};

use crate::utils::functional::{
    calculate_token_to_be_distributed
};

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

#[derive(Accounts)]
#[instruction(
reedemable_amount_in_lamports: u64,
)]
pub struct RedeemBondInstance<'info> {

    // Any Bond Pool Accounts
    #[account(mut)]
    pub bond_pool_account: Box<Account<'info, BondPoolAccount>>,
    #[account(
    mut,
    constraint = bond_pool_redeemable_mint.mint_authority == COption::Some(bond_pool_account.key())
    )]
    pub bond_pool_redeemable_mint: Account<'info, Mint>,
    #[account(mut)]
    pub bond_pool_solana_account: AccountInfo<'info>,

    // And Bond Instance Accounts
    pub bond_instance_account: Account<'info, BondInstanceAccount>,
    #[account(mut)]
    pub bond_instance_token_account: Account<'info, TokenAccount>,

    #[account(signer, mut)]
    pub purchaser: AccountInfo<'info>,  // TODO: Make him signer
    #[account(mut, constraint = purchaser_token_account.owner == purchaser.key())]
    pub purchaser_token_account: Account<'info, TokenAccount>,

    // The standard accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handle(
    ctx: Context<RedeemBondInstance>,
    reedemable_amount_in_lamports: u64
) -> ProgramResult {

    if redeemable_amount_raw <= 0 {
        return Err(ErrorCode::LowBondRedeemableAmount.into());
    }


    // TODO: Double check that the user actually has less than this in their amount
    let total_redeemable_supply: u64 = ctx.accounts.bond_pool_redeemable_token_account.amount;
    let total_token_supply: u64 = ctx.accounts.bond_pool_token_account.amount;


    /*
    * Step 1: Calculate Market Rate
    *    How many SOL, per redeemable to distribute
    */
    let token_to_be_distributed: u64 = calculate_token_to_be_distributed(
        total_token_supply,
        total_redeemable_supply,
        redeemable_amount_raw
    );

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
            &[
                [      ctx.accounts.bond_pool_account.generator.key().as_ref(), b"bondPoolAccount",
                    &[ctx.accounts.bond_pool_account.bump_bond_pool_account]
                ].as_ref()
            ],
        ),
        redeemable_amount_raw,
    )?;

    let cpi_accounts = Transfer {
        from: ctx.accounts.bond_pool_token_account.to_account_info(),
        to: ctx.accounts.purchaser_token_account.to_account_info(),
        authority: ctx.accounts.purchaser.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, token_to_be_distributed)?;



    /*
     * Step 3: Pay out Solana
     *     Can later on replace this with paying out redeemables,
     *      and the user can call another function to replace the redeemables with the bond
     */

    /* let res = anchor_lang::solana_program::system_instruction::transfer(
        ctx.accounts.bond_pool_solana_account.to_account_info().key,
        ctx.accounts.purchaser.to_account_info().key,
        solana_to_be_distributed,
    );
    invoke_signed(
        &res,
        &[ctx.accounts.bond_pool_solana_account.to_account_info(), ctx.accounts.purchaser.to_account_info()],
        &[[
            ctx.accounts.bond_pool_account.key().as_ref(), b"bondPoolSolanaAccount",
            &[ctx.accounts.bond_pool_account.bump_bond_pool_solana_account]
        ].as_ref()]
    )?;*/

    Ok(())
}
