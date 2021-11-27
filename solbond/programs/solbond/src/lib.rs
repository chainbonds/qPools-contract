//! Use docstrings as specified here: https://doc.rust-lang.org/rustdoc/how-to-write-documentation.html
use solana_program::program::invoke;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_lang::solana_program::native_token::{lamports_to_sol, sol_to_lamports};
use anchor_spl::token::{self, Burn, Mint, TokenAccount, Token, MintTo};

const DECIMALS: u8 = 1;

declare_id!("Bqv9hG1f9e3V4w5BfQu6Sqf2Su8dH8Y7ZJcy7XyZyk4A");

fn print_type_of<T>(_: &T) {
    msg!("{}", std::any::type_name::<T>())
}

// TODO: Replace all lamports with how many solana actually should be paid off.

#[program]
pub mod solbond {
    use super::*;

    // Has to create a Keypair
    pub fn initialize_bond_pool(
        ctx: Context<InitializeBondPool>,
        _bump_bond_pool_account: u8,
        _bump_bond_pool_solana_account: u8,
    ) -> ProgramResult {

        // Generate the following

        // Bind all items to the bond-account
        let bond_account = &mut ctx.accounts.bond_pool_account;

        // bond_account.initializer = ctx.accounts.initializer.key();
        bond_account.generator = ctx.accounts.initializer.key();
        bond_account.bond_pool_redeemable_mint = ctx.accounts.bond_pool_redeemable_mint.key();
        bond_account.bond_pool_redeemable_token_account = ctx.accounts.bond_pool_redeemable_token_account.key();
        bond_account.bond_pool_solana_account = ctx.accounts.bond_pool_solana_account.key();
        bond_account.bump_bond_pool_account = _bump_bond_pool_account;
        bond_account.bump_bond_pool_solana_account = _bump_bond_pool_solana_account;

        Ok(())
    }

    /**
    * We need to make two separate functions,
        one to create the bond,
        and one to make the "pay-in, redeem-token" transaction
        otherwise, the program just keeps growing, which is a problem

        Defines start and end time for the bond,
        basically requires the front-end to adhere to these times & dates ...
    */
    pub fn initialize_bond_instance(
        ctx: Context<InitializeBondInstance>,
        start_time: u64,
        end_time: u64,
        _bump_bond_instance_account: u8,
        _bump_bond_instance_solana_account: u8,
    ) -> ProgramResult {

        // TODO: Check if start timeframe is after Clock::now
        // TODO: Check if start timeframe is before end timeframe

        let bond_instance_account = &mut ctx.accounts.bond_instance_account;

        // Accounts for the initializer
        bond_instance_account.purchaser = ctx.accounts.purchaser.key();
        bond_instance_account.purchaser_token_account = ctx.accounts.purchaser_token_account.key();

        // Accounts for the bond
        bond_instance_account.bond_pool_account = ctx.accounts.bond_pool_account.key();
        // TODO: Generate these accounts!
        bond_instance_account.bond_instance_solana_account = ctx.accounts.bond_instance_solana_account.key();
        bond_instance_account.bond_instance_token_account = ctx.accounts.bond_instance_token_account.key();

        // Amount is probably not needed, because we track everything with tokens ...!
        bond_instance_account.start_time = start_time;
        bond_instance_account.end_time = end_time;

        // Include also any bumps, etc.
        bond_instance_account.bump_bond_instance_account = _bump_bond_instance_account;
        bond_instance_account.bump_bond_instance_solana_account = _bump_bond_instance_solana_account;

        Ok(())
    }

    // Should probably also include logic to remove how much you want to put into the bond...
    pub fn purchase_bond_instance(
        ctx: Context<PurchaseBondInstance>,
        amount_in_lamports: u64,
    ) -> ProgramResult {

        // TODO: Check if timeframe is before the time that the bond started

        // Write everything to the PDA
        if amount_in_lamports <= 0 {
            return Err(ErrorCode::LowBondSolAmount.into());
        }

        // TODO: Uncomment once basic functionality is working ...
        // if ctx.accounts.purchaser.to_account_info().lamports() >= amount {
        //     return Err(ErrorCode::RedeemCapacity.into());
        // }

        let bond_instance_account = &mut ctx.accounts.bond_instance_account;

        let current_timestamp: u64 = (ctx.accounts.clock.unix_timestamp) as u64;
        if bond_instance_account.start_time > current_timestamp {
            return Err(ErrorCode::TimeFrameNotPassed.into());
        }

        /*
            Buy mSOL, track total supply with redeemable-tokens ...
        */

        /**
        * Step 1: Transfer SOL to the bond's reserve ...
        */
        // Gotta get the account info ...
        // let mut bond_pool_solana_account: () = ctx.accounts.bond_pool_account;

        // TODO: Calculate market-rate
        // How many redeemables, per solana to distribute
        // There might be some truncation errors, that's why we multiple first ...
        // At the same time, there might be some overflow, that's why we divide first (?)

        // Good article on overflow, underflows in rust
        // Convert
        let amount_as_solana: f64 = lamports_to_sol(amount_in_lamports);
        // We call the lamports to sol, because our token also have 9 decimal figures, just like the solana token ...
        let token_total_supply: f64 = lamports_to_sol(ctx.accounts.bond_pool_redeemable_mint.supply);  // as f64;
        let pool_total_supply: f64 = lamports_to_sol(ctx.accounts.bond_pool_solana_account.lamports());

        // Check if these are safe operations ...
        let amount_in_redeemables: u64 = sol_to_lamports(token_total_supply * amount_as_solana / pool_total_supply);

        // TODO: Make exceptions, for when too much solana is paid in ...

        // let bond_pool_solana_account = AccountInfo::new(ctx.accounts.bond_pool_account.account.bond_pool_solana_account);
        let res = anchor_lang::solana_program::system_instruction::transfer(
            ctx.accounts.purchaser.to_account_info().key,
            ctx.accounts.bond_pool_solana_account.to_account_info().key,
            amount_in_lamports,
        );
        invoke(&res, &[ctx.accounts.purchaser.to_account_info(), ctx.accounts.bond_pool_solana_account.to_account_info()]);

        /**
        * Step 2: Mint new redeemables to the middleware escrow to keep track of this input ...
        */

        /**
        * No it is not, because the program is the authority, not the signer ...
        * Only this program can sign on these things...
        * TODO: Are PDAs the solution? isn't it possible to invoke the MintTo command by everyone?
        * This is ok for the MVP, will definitely need to do auditing and re-writing this probably ...
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

    pub fn redeem_bond_instance(
        ctx: Context<RedeemBondInstance>,
        amount_in_redeemables: u64,
    ) -> ProgramResult {

        // TODO: Check if timeframe is after the time that the bond ended
        // TODO: Check if amount is less than what was paid in so far

        // Write everything to the PDA
        if amount_in_redeemables <= 0 {
            return Err(ErrorCode::LowBondSolAmount.into());
        }

        let bond_instance_account = &mut ctx.accounts.bond_instance_account;

        // let current_timestamp: u64 = ctx.accounts.clock.unix_timestamp as

        // TODO: Have a bunch of constraints across bondAccount
        if ctx.accounts.purchaser_token_account.to_account_info().lamports() > amount_in_redeemables {
            return Err(ErrorCode::RedeemCapacity.into());
        }

        // TODO: Replace all this with safe operations
        let current_timestamp: u64 = (ctx.accounts.clock.unix_timestamp) as u64;
        if bond_instance_account.end_time < current_timestamp {
            return Err(ErrorCode::TimeFrameNotPassed.into());
        }

        /**
         * Burn Bond Token
         */
        // let seeds = &[
        //     ctx.accounts.initializer.to_account_info().key.as_ref(),
        //     &[bond_account.bump]
        // ];
        // let signer = &[&seeds[..]];
        // let cpi_accounts = Burn {
        //     mint: ctx.accounts.redeemable_mint.to_account_info(),
        //     to: ctx.accounts.initializer_token_account.to_account_info(),
        //     authority: ctx.accounts.initializer.to_account_info(),
        // };
        // let cpi_program = ctx.accounts.token_program.to_account_info();
        // let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        // token::burn(cpi_ctx, _redeemable_amount)?;
        //
        // /**
        //  * Pay out Solana
        //  */
        // let res = anchor_lang::solana_program::system_instruction::transfer(
        //     ctx.accounts.bond_solana_account.to_account_info().key,
        //     ctx.accounts.initializer.to_account_info().key,
        //     _redeemable_amount,
        // );
        // invoke(&res, &[ctx.accounts.bond_solana_account.to_account_info(), ctx.accounts.initializer.to_account_info()]);

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

    // TODO: Add a couple constraints, etc.

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
    pub initializer: AccountInfo<'info>,  // TODO: Make him signer


    // The standards accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

// seeds = [purchaser.key.as_ref(), b"bondPoolAccount"], bump = _bump_bond_pool_account
// we don't have access to the seeds of the bond pool account anymore, so shouldn't use this anymore ...
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
    pub purchaser: AccountInfo<'info>,  // TODO: Make him signer
    // #[account(mut)]
    #[account(mut, constraint = purchaser_token_account.owner == purchaser.key())]
    pub purchaser_token_account: Account<'info, TokenAccount>,

    // Any bond-instance specific accounts
    // Assume this is the bond instance account, which represents the bond which is "purchased"
    #[account(
        init,
        payer = purchaser,
        space = 64 + 64 + 64 + 64 + 64 + 64 + 64 + 64 + 8 + 8 + 8,
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

    #[account(mut)]
    pub bond_pool_account: Account<'info, BondPoolAccount>,

    // Checking for seeds here is probably overkill honestly... right?
    // seeds = [bond_pool_account.key().as_ref(), b"bondPoolSolanaAccount"], bump = _bump_bond_pool_solana_account
    #[account(mut)]
    pub bond_pool_solana_account: AccountInfo<'info>,
    #[account(
        mut,
        constraint = bond_pool_redeemable_mint.mint_authority == COption::Some(bond_pool_account.key())
    )]
    pub bond_pool_redeemable_mint: Account<'info, Mint>,

    // Assume this is the purchaser, who goes into a contract with himself
    #[account(signer, mut)]
    pub purchaser: AccountInfo<'info>,  // TODO: Make him signer
    // // #[account(mut)]
    // #[account(mut, constraint = purchaser_token_account.owner == purchaser.key())]
    // pub purchaser_token_account: Account<'info, TokenAccount>,
    //
    // // Any bond-instance specific accounts
    // // Assume this is the bond instance account, which represents the bond which is "purchased"
    // TODO: Also include the seeds and bump!
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

    /*
        Any bond-instance owned accounts
     */
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
    #[msg("SOL to be paid into the bond should not be zero")]
    LowBondSolAmount,
    #[msg("Asking for too much SOL when redeeming!")]
    RedeemCapacity,
    #[msg("Bond has not gone past timeframe yet")]
    TimeFrameNotPassed,
    #[msg("There was an issue computing the market rate. MarketRateOverflow")]
    MarketRateOverflow,
    #[msg("There was an issue computing the market rate. MarketRateUnderflow")]
    MarketRateUnderflow,
}
