use solana_program::program::invoke;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, MintTo};

use crate::{
    ErrorCode,
    PurchaseBond
};

use crate::utils::functional::{
    calculate_redeemables_to_be_distributed
};

pub fn purchase_bond_logic(
    ctx: Context<PurchaseBond>,
    solana_amount_in_lamports: u64
) -> ProgramResult {

    if solana_amount_in_lamports <= 0 {
        return Err(ErrorCode::LowBondSolAmount.into());
    }
    if ctx.accounts.purchaser.to_account_info().lamports() < solana_amount_in_lamports {
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
    let total_token_supply: u64 = ctx.accounts.bond_pool_redeemable_mint.supply;
    let total_solana_supply: u64 = ctx.accounts.bond_pool_solana_account.lamports();

    // checked in function, looks correct
    let redeemable_to_be_distributed: u64 = calculate_redeemables_to_be_distributed(
        total_solana_supply,
        total_token_supply,
        solana_amount_in_lamports
    );

    /*
    * Step 2: Transfer SOL to the bond's reserve
    */
    // Checking if there was an infinite amount
    // if amount_in_redeemables.is_infinite() {
    //     return Err(Error::MarketRateOverflow.into());
    // }

    let res = anchor_lang::solana_program::system_instruction::transfer(
        ctx.accounts.purchaser.to_account_info().key,
        ctx.accounts.bond_pool_solana_account.to_account_info().key,
        solana_amount_in_lamports,
    );
    invoke(
        &res,
        &[ctx.accounts.purchaser.to_account_info(), ctx.accounts.bond_pool_solana_account.to_account_info()]
    )?;

    /*
    * Step 3: Mint new redeemables to the middleware escrow to keep track of this input
    *      Only this program can sign on these things, because all accounts are owned by the program
    *      Are PDAs the solution? isn't it possible to invoke the MintTo command by everyone?
    *      This is ok for the MVP, will definitely need to do auditing and re-writing this probably
    */
    /**
      We just mint to the user now lol
     */
    let cpi_accounts = MintTo {
        mint: ctx.accounts.bond_pool_redeemable_mint.to_account_info(),
        to: ctx.accounts.purchaser_token_account.to_account_info(),
        authority: ctx.accounts.bond_pool_account.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    token::mint_to(
        CpiContext::new_with_signer(
            cpi_program,
            cpi_accounts,
            &[[
                ctx.accounts.bond_pool_account.generator.key().as_ref(), b"bondPoolAccount",
                &[ctx.accounts.bond_pool_account.bump_bond_pool_account]
            ].as_ref()],
        ),
        redeemable_to_be_distributed,
    )?;

    Ok(())
}