use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

use crate::ErrorCode;
use crate::state::BondPoolAccount;
use crate::utils::functional::calculate_redeemables_to_be_distributed;

#[derive(Accounts)]
#[instruction(
amount_in_lamports: u64,
)]
pub struct PurchaseBond<'info> {

    // All Bond Pool Accounts
    #[account(mut)]
    pub bond_pool_account: Account<'info, BondPoolAccount>,
    // Checking for seeds here is probably overkill honestly... right?
    // seeds = [bond_pool_account.key().as_ref(), b"bondPoolSolanaAccount"], bump = _bump_bond_pool_solana_accounz
    #[account(
    mut,
    constraint = bond_pool_redeemable_mint.mint_authority == COption::Some(bond_pool_account.key())
    )]
    pub bond_pool_redeemable_mint: Account<'info, Mint>,

    #[account(
    mut
    )]
    pub bond_pool_token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub bond_pool_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub bond_pool_redeemable_token_account: Account<'info, TokenAccount>,

    // All Purchaser Accounts
    #[account(signer, mut)]
    pub purchaser: AccountInfo<'info>,  // TODO: Make him signer
    // // #[account(mut)]
    // #[account(mut, constraint = purchaser_token_account.owner == purchaser.key())]
    // pub purchaser_token_account: Account<'info, TokenAccount>,
    //
    #[account(mut)]
    pub purchaser_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub purchaser_redeemable_token_account: Box<Account<'info, TokenAccount>>,

    // The standard accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<PurchaseBond>,
    token_amount_raw: u64
) -> ProgramResult {

    if token_amount_raw <= 0 {
        return Err(ErrorCode::LowBondTokAmount.into());
    }
    if ctx.accounts.purchaser_token_account.amount < token_amount_raw {
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
    let total_redeemable_supply: u64 = ctx.accounts.bond_pool_redeemable_token_account.amount;
    let total_token_supply: u64 = ctx.accounts.bond_pool_token_account.amount;

    // checked in function, looks correct
    let redeemable_to_be_distributed: u64 = calculate_redeemables_to_be_distributed(
        total_token_supply,
        total_redeemable_supply,
        token_amount_raw
    );

    /*
    * Step 2: Transfer SOL to the bond's reserve
    */
    // Checking if there was an infinite amount
    // if amount_in_redeemables.is_infinite() {
    //     return Err(Error::MarketRateOverflow.into());
    // }
    /// this needs to become a normal token transfer now.

    // Transfer user's token to pool token account.
    let cpi_accounts = Transfer {
        from: ctx.accounts.purchaser_token_account.to_account_info(),
        to: ctx.accounts.bond_pool_token_account.to_account_info(),
        authority: ctx.accounts.purchaser.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, token_amount_raw)?;

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
        to: ctx.accounts.purchaser_redeemable_token_account.to_account_info(),
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