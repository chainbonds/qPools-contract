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

use crate::utils::functional::{
    calculate_market_rate_redeemables_per_solana,
    calculate_redeemables_to_be_distributed,
    calculate_solana_to_be_distributed,
    calculate_profits_and_carry
};

pub fn purchase_bond_instance_logic(
    ctx: Context<PurchaseBondInstance>,
    solana_amount_in_lamports: u64
) -> ProgramResult {

    if amount_in_lamports <= 0 {
        return Err(ErrorCode::LowBondSolAmount.into());
    }
    if ctx.accounts.purchaser.to_account_info().lamports() < amount_in_lamports {
        return Err(ErrorCode::RedeemCapacity.into());
    }
    let bond_instance_account = &mut ctx.accounts.bond_instance_account;

    /*
    * Step 1: Calculate Market Rate
    *    How many redeemables, per solana to distribute
    *    If the reserve is empty as of now, fixate 1 Token to be equal to 1 SOL
    */
    // TODO: Double check that the user actually has less than this in their amount
    let total_token_supply: u64 = ctx.accounts.bond_pool_redeemable_mint.supply;
    let total_solana_supply: u64 = ctx.accounts.bond_pool_solana_account.lamports();

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
        ), redeemable_to_be_distributed)?;

    Ok(())
}