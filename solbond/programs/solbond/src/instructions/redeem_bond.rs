use solana_program::program::invoke_signed;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn};

use crate::{
    ErrorCode,
    RedeemBond
};

use crate::utils::functional::{
    calculate_solana_to_be_distributed
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

pub fn redeem_bond_logic(
    ctx: Context<RedeemBond>,
    reedemable_amount_in_lamports: u64
) -> ProgramResult {

    if reedemable_amount_in_lamports <= 0 {
        return Err(ErrorCode::LowBondRedeemableAmount.into());
    }


    // TODO: Double check that the user actually has less than this in their amount
    let total_token_supply: u64 = ctx.accounts.bond_pool_redeemable_mint.supply;
    let total_solana_supply: u64 = ctx.accounts.bond_pool_solana_account.lamports();


    /*
    * Step 1: Calculate Market Rate
    *    How many SOL, per redeemable to distribute
    *    If the reserve is empty as of now, fixate 1 Token to be equal to 1 SOL
    */
    let solana_to_be_distributed: u64 = calculate_solana_to_be_distributed(
        total_solana_supply,
        total_token_supply,
        reedemable_amount_in_lamports
    );

    /*
     * Step 2: Burn Bond Token
     */
    let cpi_accounts = Burn {
        mint: ctx.accounts.bond_pool_redeemable_mint.to_account_info(),
        to: ctx.accounts.purchaser_token_account.to_account_info(),
        authority: ctx.accounts.purchaser.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();


    token::burn(
        CpiContext::new_with_signer(
            cpi_program,
            cpi_accounts,
            &[
                [                  ctx.accounts.bond_pool_account.generator.key().as_ref(), b"bondPoolAccount",
                    &[ctx.accounts.bond_pool_account.bump_bond_pool_account]
                ].as_ref()
            ],
        ),
        reedemable_amount_in_lamports,
    )?;

    /*
     * Step 3: Pay out Solana
     *     Can later on replace this with paying out redeemables,
     *      and the user can call another function to replace the redeemables with the bond
     */
    let res = anchor_lang::solana_program::system_instruction::transfer(
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
    )?;

    Ok(())
}
