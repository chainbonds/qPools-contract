//! Use docstrings as specified here: https://doc.rust-lang.org/rustdoc/how-to-write-documentation.html
use solana_program::program::{invoke, invoke_signed};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_lang::solana_program::native_token::{lamports_to_sol, sol_to_lamports};
use anchor_spl::token::{self, Burn, Mint, TokenAccount, Token, MintTo};

// const DECIMALS: u8 = 1;

declare_id!("Bqv9hG1f9e3V4w5BfQu6Sqf2Su8dH8Y7ZJcy7XyZyk4A");

// TODO: Replace all lamports with how many solana actually should be paid off.

/*
    TODO: 1
    We should probably have a separate function to do the portfolio (re-)distribuction
    Buy mSOL, track total supply with redeemable-tokens ...

    TODO: 2
    Figure out a way to calculate the final bond, as well as the stepwise points
    you can probably use a simple formula
    and keep track of the amount that was already paid in
    You can save these variables as part of the state

    TODO: 3
    Have a bunch of constraints across bondAccount

    TODO: 4
    Have another function to pay out profits ...
    I guess this is also where our own profit-account comes in ...

*/

/**
* Calculate how many of the profits to pay out
*/
// pub fn redeem_bond_instance(
//     ctx: Context<RedeemBondInstance>,
//     amount_in_redeemables: u64) -> f64 {
//
//     return 0.0
// }

#[program]
pub mod solbond {
    use super::*;

    pub fn initialize_bond_pool(
        ctx: Context<InitializeBondPool>,
        _bump_bond_pool_account: u8,
        _bump_bond_pool_solana_account: u8,
    ) -> ProgramResult {

        let bond_account = &mut ctx.accounts.bond_pool_account;
        bond_account.generator = ctx.accounts.initializer.key();
        bond_account.bond_pool_redeemable_mint = ctx.accounts.bond_pool_redeemable_mint.key();
        bond_account.bond_pool_redeemable_token_account = ctx.accounts.bond_pool_redeemable_token_account.key();
        bond_account.bond_pool_solana_account = ctx.accounts.bond_pool_solana_account.key();
        bond_account.bump_bond_pool_account = _bump_bond_pool_account;
        bond_account.bump_bond_pool_solana_account = _bump_bond_pool_solana_account;

        Ok(())
    }

    /**
    *  We need to make two separate functions,
        one to create the bond,
        and one to make the "pay-in, redeem-token" transaction
        otherwise, the program just keeps growing, which is a problem

        Defines start and end time for the bond,
        basically requires the front-end to adhere to these times & dates ...

        All times are provided as unix timestamps,
            start_time: u64,
            end_time: u64,
        You can use the solana https://docs.rs/solana-program/1.8.5/solana_program/clock/struct.Clock.html
        Clock::unix_timestamp to compare items to

    */
    pub fn initialize_bond_instance(
        ctx: Context<InitializeBondInstance>,
        start_time: u64,
        end_time: u64,
        _bump_bond_instance_account: u8,
        _bump_bond_instance_solana_account: u8,
    ) -> ProgramResult {

        if start_time >= end_time {
            return Err(ErrorCode::TimeFrameIsNotAnInterval.into());
        }
        msg!("Current timestamp is: {}", ctx.accounts.clock.unix_timestamp);
        if (ctx.accounts.clock.unix_timestamp as u64) >= start_time {
            return Err(ErrorCode::TimeFrameIsInThePast.into());
        }

        let bond_instance_account = &mut ctx.accounts.bond_instance_account;

        // Accounts for the initializer
        bond_instance_account.purchaser = ctx.accounts.purchaser.key();
        bond_instance_account.purchaser_token_account = ctx.accounts.purchaser_token_account.key();

        // Currently these accounts are generated in the frontend, we should probably generate these here ...
        // Accounts for the bond
        bond_instance_account.bond_pool_account = ctx.accounts.bond_pool_account.key();
        bond_instance_account.bond_instance_solana_account = ctx.accounts.bond_instance_solana_account.key();
        bond_instance_account.bond_instance_token_account = ctx.accounts.bond_instance_token_account.key();

        // Amount is probably not needed, because we track everything with tokens ...!
        bond_instance_account.start_time = start_time;
        bond_instance_account.end_time = end_time;

        // This value will be incremented when adding more to the bond treasury
        bond_instance_account.initial_payin_amount_in_lamports = 0;
        bond_instance_account.last_profit_payout = start_time;

        // Include also any bumps, etc.
        bond_instance_account.bump_bond_instance_account = _bump_bond_instance_account;
        bond_instance_account.bump_bond_instance_solana_account = _bump_bond_instance_solana_account;

        Ok(())
    }

    // Should probably also include logic to remove how much you want to put into the bond...
    /**
    * Pay in some SOL into the bond that way created with initialize_bond_context.
    * amount_in_lamports is how much solana to pay in, provided in lampots (i.e. 10e-9 of 1SOL)
    */
    pub fn purchase_bond_instance(
        ctx: Context<PurchaseBondInstance>,
        amount_in_lamports: u64,
    ) -> ProgramResult {
        if amount_in_lamports <= 0 {
            return Err(ErrorCode::LowBondSolAmount.into());
        }
        if ctx.accounts.purchaser.to_account_info().lamports() >= amount_in_lamports {
            return Err(ErrorCode::RedeemCapacity.into());
        }
        let bond_instance_account = &mut ctx.accounts.bond_instance_account;
        bond_instance_account.initial_payin_amount_in_lamports += amount_in_lamports;
        if (ctx.accounts.clock.unix_timestamp as u64) >= bond_instance_account.start_time  {
            return Err(ErrorCode::TimeFrameCannotPurchaseAdditionalBondAmount.into());
        }

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

    /**
    * Redeem the bond, at and point in time
    *
    *   If it is before the bond runs out,
    +     then you should pay out part of the profits that were generated so far
    *   If it is after the bond runs out,
    *     then you should pay out all the profits, and the initial pay-in amount (face-value / par-value) that was paid in
    */
    pub fn redeem_bond_instance(
        ctx: Context<RedeemBondInstance>,
        amount_in_redeemables: u64,
    ) -> ProgramResult {

        if amount_in_redeemables <= 0 {
            return Err(ErrorCode::LowBondRedeemableAmount.into());
        }

        let bond_instance_account = &mut ctx.accounts.bond_instance_account;
        if bond_instance_account.end_time > (ctx.accounts.clock.unix_timestamp as u64) {
            return Err(ErrorCode::TimeFrameCannotPurchaseAdditionalBondAmount.into());
        }
        // Maybe: Check if amount is less than what was paid in so far
        // I don't think this is possible just with the key.
        // It might make more sense to write another token into this

        /*
        * Step 1: Calculate market rate
        */
        // If the user takes out anything, the timeframe then is also updated.
        let payout_amount_in_lamports: u64 = sol_to_lamports(
            lamports_to_sol(ctx.accounts.bond_pool_solana_account.lamports()) /
            lamports_to_sol(ctx.accounts.bond_pool_redeemable_mint.supply) *
            // TODO: Be careful here, make sure the redeemables' decimals are maybe recorded somewhere, right now we can do this because our token has 9 decimals
            lamports_to_sol(amount_in_redeemables)
        );

        if amount_in_redeemables <= 0 {
            return Err(ErrorCode::LowBondSolAmount.into());
        }

        // let bond_instance_account = &mut ctx.accounts.bond_instance_account;
        if ctx.accounts.purchaser_token_account.to_account_info().lamports() > amount_in_redeemables {
            return Err(ErrorCode::RedeemCapacity.into());
        }

        /*
         * Step 2: Burn Bond Token
         */
        let cpi_accounts = Burn {
            mint: ctx.accounts.bond_pool_redeemable_mint.to_account_info(),
            to: ctx.accounts.bond_instance_token_account.to_account_info(),
            authority: ctx.accounts.bond_instance_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::burn(
            CpiContext::new_with_signer(
                cpi_program,
                cpi_accounts,
                &[
                    [
                        ctx.accounts.bond_instance_account.purchaser.key().as_ref(), b"bondInstanceAccount",
                        &[ctx.accounts.bond_instance_account.bump_bond_instance_account]
                    ].as_ref(),
                    [
                        ctx.accounts.bond_pool_account.generator.key().as_ref(), b"bondPoolAccount",
                        &[ctx.accounts.bond_pool_account.bump_bond_pool_account]
                    ].as_ref()
                ]
            ), amount_in_redeemables)?;

        /*
         * Step 3: Pay out Solana
         *     Can later on replace this with paying out redeemables,
         *      and the user can call another function to replace the redeemables with the bond
         */
        let res = anchor_lang::solana_program::system_instruction::transfer(
            ctx.accounts.bond_pool_solana_account.to_account_info().key,
            ctx.accounts.purchaser.to_account_info().key,
            payout_amount_in_lamports,
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

}

/**
 * Contexts
 */

#[derive(Accounts)]
#[instruction(
    _bump_bond_pool_account: u8,
    _bump_bond_pool_solana_account: u8
)]
pub struct InitializeBondPool<'info> {

    // The account which represents the bond pool account
    #[account(
        init,
        payer = initializer,
        space = 8 + 64 + 64 + 64 + 64,
        seeds = [initializer.key.as_ref(), b"bondPoolAccount"], bump = _bump_bond_pool_account
    )]
    pub bond_pool_account: Account<'info, BondPoolAccount>,
    #[account(
        seeds = [bond_pool_account.key().as_ref(), b"bondPoolSolanaAccount"], bump = _bump_bond_pool_solana_account
    )]
    pub bond_pool_solana_account: AccountInfo<'info>,
    #[account(
        constraint = bond_pool_redeemable_mint.mint_authority == COption::Some(bond_pool_account.key()),
        constraint = bond_pool_redeemable_mint.supply == 0
    )]
    pub bond_pool_redeemable_mint: Account<'info, Mint>,
    #[account(mut, constraint = bond_pool_redeemable_token_account.owner == bond_pool_account.key())]
    pub bond_pool_redeemable_token_account: Account<'info, TokenAccount>,

    // The account which generate the bond pool
    #[account(signer)]
    pub initializer: AccountInfo<'info>,

    // The standards accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(
    start_time: u64,
    end_time: u64,
    _bump_bond_instance_account: u8,
    _bump_bond_instance_solana_account: u8,
)]
pub struct InitializeBondInstance<'info> {

    #[account(mut)]
    pub bond_pool_account: Account<'info, BondPoolAccount>,

    // Assume this is the purchaser, who goes into a contract with himself
    #[account(signer, mut)]
    pub purchaser: AccountInfo<'info>,
    // #[account(mut)]
    #[account(mut, constraint = purchaser_token_account.owner == purchaser.key())]
    pub purchaser_token_account: Account<'info, TokenAccount>,

    // Any bond-instance specific accounts
    // Assume this is the bond instance account, which represents the bond which is "purchased"
    #[account(
        init,
        payer = purchaser,
        space = 64 + 64 + 64 + 64 + 64 + 64 + 64 + 64 + 64 + 64 + 8 + 8 + 8,
        seeds = [purchaser.key.as_ref(), b"bondInstanceAccount"],
        bump = {msg!("bump be {}", _bump_bond_instance_account); _bump_bond_instance_account}
    )]
    pub bond_instance_account: Account<'info, BondInstanceAccount>,
    #[account(mut, constraint = bond_instance_token_account.owner == bond_instance_account.key())]
    pub bond_instance_token_account: Account<'info, TokenAccount>,
    #[account(
    seeds = [bond_instance_account.key().as_ref(), b"bondInstanceSolanaAccount"], bump = _bump_bond_instance_solana_account
    )]
    pub bond_instance_solana_account: AccountInfo<'info>,

    // The standard accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,

}

#[derive(Accounts)]
#[instruction(
    amount: u64,
)]
pub struct PurchaseBondInstance<'info> {

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
    #[account(mut)]
    pub bond_pool_solana_account: AccountInfo<'info>,

    // All Purchaser Accounts
    #[account(signer, mut)]
    pub purchaser: AccountInfo<'info>,  // TODO: Make him signer
    // // #[account(mut)]
    // #[account(mut, constraint = purchaser_token_account.owner == purchaser.key())]
    // pub purchaser_token_account: Account<'info, TokenAccount>,
    //
    // // Any bond-instance specific accounts
    // // Assume this is the bond instance account, which represents the bond which is "purchased"
    // TODO: Also include the seeds and bump!

    // All bond instance accounts
    pub bond_instance_account: Account<'info, BondInstanceAccount>,
    // constraint = bond_instance_token_account.owner == bond_instance_account.key()
    #[account(mut)]
    pub bond_instance_token_account: Account<'info, TokenAccount>,

    // #[account(
    //     seeds = [bond_instance_account.key().as_ref(), b"bondInstanceSolanaAccount"], bump = _bump_bond_instance_solana_account
    // )]
    // pub bond_instance_solana_account: AccountInfo<'info>,

    // The standard accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}


#[derive(Accounts)]
#[instruction(
    amount_in_redeemables: u64
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

/**
* State
*/
#[account]
pub struct BondPoolAccount {
    pub generator: Pubkey,

    pub bond_pool_redeemable_mint: Pubkey,
    pub bond_pool_redeemable_token_account: Pubkey,
    pub bond_pool_solana_account: Pubkey,

    // Include also any bumps, etc.
    pub bump_bond_pool_account: u8,
    pub bump_bond_pool_solana_account: u8,
}

#[account]
pub struct BondInstanceAccount {

    // Accounts for the initializer
    pub purchaser: Pubkey,
    pub purchaser_token_account: Pubkey,

    // Accounts for the "parenting" bond pool
    pub bond_pool_account: Pubkey,

    // Accounts for the bond instance
    pub bond_instance_solana_account: Pubkey,
    pub bond_instance_token_account: Pubkey,

    // Amount is probably not needed, because we track everything with tokens ...!
    pub start_time: u64,
    pub end_time: u64,

    pub initial_payin_amount_in_lamports: u64,
    // Is a unix-timestamp, which records when the last payout was made
    pub last_profit_payout: u64,

    // Include also any bumps, etc.
    pub bump_bond_instance_account: u8,
    pub bump_bond_pool_account: u8,
    pub bump_bond_instance_solana_account: u8,
}


/**
 * Error definitions
 */
#[error]
pub enum ErrorCode {
    #[msg("Redeemables to be paid out are somehow zero!")]
    LowBondRedeemableAmount,
    #[msg("SOL to be paid into the bond should not be zero")]
    LowBondSolAmount,
    #[msg("Asking for too much SOL when redeeming!")]
    RedeemCapacity,
    #[msg("Provided times are not an interval (end-time before start-time!)")]
    TimeFrameIsNotAnInterval,
    #[msg("Provided starting time is not in the future. You should make it in such a way that it is slightly in the future, s.t. you have the ability to pay in some amounts.")]
    TimeFrameIsInThePast,
    #[msg("Bond is already locked, you cannot pay in more into this bond!")]
    TimeFrameCannotPurchaseAdditionalBondAmount,
    #[msg("Bond has not gone past timeframe yet")]
    TimeFrameNotPassed,
    #[msg("There was an issue computing the market rate. MarketRateOverflow")]
    MarketRateOverflow,
    #[msg("There was an issue computing the market rate. MarketRateUnderflow")]
    MarketRateUnderflow,
}
