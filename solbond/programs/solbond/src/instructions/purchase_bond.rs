use solana_program::program::{invoke, invoke_signed};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_lang::solana_program::native_token::{lamports_to_sol, sol_to_lamports};
use anchor_spl::token::{self, Burn, Mint, TokenAccount, Token, MintTo};

use crate::{
    ErrorCode,
    BondInstanceAccount,
    BondPoolAccount,
    PurchaseBondInstance,
};

pub fn purchase_bond_instance_logic(
    ctx: Context<PurchaseBondInstance>,
    amount_in_lamports: u64
) -> ProgramResult {

    if amount_in_lamports <= 0 {
        return Err(ErrorCode::LowBondSolAmount.into());
    }
    if ctx.accounts.purchaser.to_account_info().lamports() < amount_in_lamports {
        return Err(ErrorCode::RedeemCapacity.into());
    }
    let bond_instance_account = &mut ctx.accounts.bond_instance_account;
    bond_instance_account.initial_payin_amount_in_lamports += amount_in_lamports;
    msg!("Current timestep is: {}", (ctx.accounts.clock.unix_timestamp as u64));
    msg!("Start time is: {}", bond_instance_account.start_time);
    if (ctx.accounts.clock.unix_timestamp as u64) >= bond_instance_account.start_time  {
        msg!("Boolean becomes: {}", (ctx.accounts.clock.unix_timestamp as u64) >= bond_instance_account.start_time);
        return Err(ErrorCode::TimeFrameCannotPurchaseAdditionalBondAmount.into());
    }
    msg!("Passing..");

    /*
    * Step 1: Transfer SOL to the bond's reserve ...
    *    How many redeemables, per solana to distribute
    *    If the reserve is empty as of now, fixate 1 Token to be equal to 1 SOL
    *    Gotta make a case-distinction. If nothing was paid-in, define the difference as 1Token = 1SOL
    */
    let amount_as_solana: f64 = lamports_to_sol(amount_in_lamports);
    // We call the lamports to sol, because our token also have 9 decimal figures, just like the solana token ...
    let token_total_supply: f64 = lamports_to_sol(ctx.accounts.bond_pool_redeemable_mint.supply);  // as f64;
    let pool_total_supply: f64 = lamports_to_sol(ctx.accounts.bond_pool_solana_account.lamports());

    let amount_in_redeemables: u64;
    if (token_total_supply > 0.0) && (pool_total_supply > 0.0) {
        amount_in_redeemables = sol_to_lamports(token_total_supply * amount_as_solana / pool_total_supply);
    } else {
        msg!("Initiating a new pool TokenSupply: {}, PoolReserve: {}, Amount: {}", token_total_supply, pool_total_supply, amount_as_solana);
        amount_in_redeemables = sol_to_lamports(1.0 * amount_as_solana);
    }

    // Checking if there was an infinite amount
    // if amount_in_redeemables.is_infinite() {
    //     return Err(Error::MarketRateOverflow.into());
    // }

    let res = anchor_lang::solana_program::system_instruction::transfer(
        ctx.accounts.purchaser.to_account_info().key,
        ctx.accounts.bond_pool_solana_account.to_account_info().key,
        amount_in_lamports,
    );
    invoke(
        &res,
        &[ctx.accounts.purchaser.to_account_info(), ctx.accounts.bond_pool_solana_account.to_account_info()]
    )?;

    /*
    * Step 2: Mint new redeemables to the middleware escrow to keep track of this input
    *      Only this program can sign on these things, because all accounts are owned by the program
    *      Are PDAs the solution? isn't it possible to invoke the MintTo command by everyone?
    *      This is ok for the MVP, will definitely need to do auditing and re-writing this probably
    */
    let cpi_accounts = MintTo {
        mint: ctx.accounts.bond_pool_redeemable_mint.to_account_info(),
        to: ctx.accounts.bond_instance_token_account.to_account_info(),
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
        ), amount_in_redeemables)?;

    Ok(())
}