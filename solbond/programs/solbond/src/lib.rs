//! Use docstrings as specified here: https://doc.rust-lang.org/rustdoc/how-to-write-documentation.html
use solana_program::program::invoke;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Burn, Mint, TokenAccount, Token, MintTo};

const DECIMALS: u8 = 1;

declare_id!("Bqv9hG1f9e3V4w5BfQu6Sqf2Su8dH8Y7ZJcy7XyZyk4A");

fn print_type_of<T>(_: &T) {
    msg!("{}", std::any::type_name::<T>())
}

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

    // pub fn purchase_bond_instance(
    //     ctx: Context<PurchaseBondInstance>,
    //     amount: u64,
    //     start_time: u64,
    //     end_time: u64,
    //     _bump_bond_pool_account: u8,
    //     _bump_bond_pool_solana_account: u8,
    //     _bump_bond_instance_account: u8,
    //     _bump_bond_instance_solana_account: u8,
    // ) -> ProgramResult {
    //
    //     // Write everything to the PDA
    //     if amount <= 0 {
    //         return Err(ErrorCode::LowBondSolAmount.into());
    //     }
    //
    //
    //     /*
    //         Buy mSOL, track total supply with redeemable-tokens ...
    //     */
    //
    //     /**
    //     * Step 1: Transfer SOL to the bond's reserve ...
    //     */
    //     // Gotta get the account info ...
    //     // let mut bond_pool_solana_account: () = ctx.accounts.bond_pool_account;
    //
    //     // let bond_pool_solana_account = AccountInfo::new(ctx.accounts.bond_pool_account.account.bond_pool_solana_account);
    //     let res = anchor_lang::solana_program::system_instruction::transfer(
    //         ctx.accounts.purchaser.to_account_info().key,
    //         ctx.accounts.bond_pool_solana_account.to_account_info().key,
    //         amount,
    //     );
    //     invoke(&res, &[ctx.accounts.purchaser.to_account_info(), ctx.accounts.bond_pool_solana_account.to_account_info()]);
    //
    //     /**
    //     * Step 2: Mint new redeemables to the middleware escrow to keep track of this input ...
    //     */
    //     // We need to have seeds, and a signer, because this operation is invoked through a PDA
    //     // But does this mean that anyone can invoke this command?
    //     // let seeds = &[
    //     //     [ctx.bond_pool_account.initializer.key.as_ref(), b"bondPoolAccount"],
    //     //     // BOND_PDA_SEED,
    //     //     &[_bump]
    //     // ];
    //     // let signer = &[&seeds[..]];
    //     //
    //     // let cpi_accounts = MintTo {
    //     //     mint: ctx.accounts.bond_pool_redeemable_mint.to_account_info(),
    //     //     to: ctx.accounts.bond_instance_token_account.to_account_info(),
    //     //     authority: ctx.accounts.bond_pool_account.to_account_info(),
    //     // };
    //     // let cpi_program = ctx.accounts.token_program.to_account_info();
    //     // let cpi_ctx = CpiContext::new_with_signer(
    //     //     cpi_program,
    //     //     cpi_accounts,
    //     //     signer,
    //     // );
    //     // // `amount` tracks 1-to-1 how much solana was already paid in ...
    //     // token::mint_to(cpi_ctx, amount)?;
    //
    //     Ok(())
    // }

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
        space = 8 + 64 + 64 + 64,
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
        space = 64 + 64 + 64 + 64 + 64 + 64 + 64 + 64 + 64 + 8 + 8 + 8,
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

// #[derive(Accounts)]
// #[instruction(
//     amount: u64,
//     start_time: u64,
//     end_time: u64,
//     _bump_bond_pool_account: u8,
//     _bump_bond_pool_solana_account: u8,
//     _bump_bond_instance_account: u8,
//     _bump_bond_instance_solana_account: u8,
// )]
// pub struct PurchaseBondInstance<'info> {
//
//     #[account(mut)]
//     pub bond_pool_account: Account<'info, BondPoolAccount>,
//     #[account(
//         mut,
//         seeds = [bond_pool_account.key().as_ref(), b"bondPoolSolanaAccount"], bump = _bump_bond_pool_solana_account
//     )]
//     pub bond_pool_solana_account: AccountInfo<'info>,
//     #[account(
//         constraint = bond_pool_redeemable_mint.mint_authority == COption::Some(bond_pool_account.key()),
//     )]
//     pub bond_pool_redeemable_mint: Account<'info, Mint>,
//
//     // Assume this is the purchaser, who goes into a contract with himself
//     #[account(signer, mut)]
//     pub purchaser: AccountInfo<'info>,  // TODO: Make him signer
//     // #[account(mut)]
//     #[account(mut, constraint = purchaser_token_account.owner == purchaser.key())]
//     pub purchaser_token_account: Account<'info, TokenAccount>,
//
//     // Any bond-instance specific accounts
//     // Assume this is the bond instance account, which represents the bond which is "purchased"
//     #[account(
//         init,
//         payer = purchaser,
//         space = 64 + 64 + 64 + 64 + 64 + 64 + 64 + 64 + 64 + 8 + 8 + 8,
//         seeds = [purchaser.key.as_ref(), b"bondInstanceAccount"],
//         bump = {msg!("bump be {}", _bump_bond_instance_account); _bump_bond_instance_account}
//     )]
//     pub bond_instance_account: Account<'info, BondInstanceAccount>,
//
//     #[account(mut, constraint = bond_instance_token_account.owner == bond_instance_account.key())]
//     pub bond_instance_token_account: Account<'info, TokenAccount>,
//     #[account(
//         seeds = [bond_instance_account.key().as_ref(), b"bondInstanceSolanaAccount"], bump = _bump_bond_instance_solana_account
//     )]
//     pub bond_instance_solana_account: AccountInfo<'info>,
//
//     // The standard accounts
//     pub rent: Sysvar<'info, Rent>,
//     pub clock: Sysvar<'info, Clock>,
//     pub system_program: Program<'info, System>,
//     pub token_program: Program<'info, Token>,
// }

//
// #[derive(Accounts)]
// pub struct RedeemBond<'info> {
//     pub bond_instance_account: Account<'info, BondInstanceAccount>,
//
//     // The standard accounts
//     pub rent: Sysvar<'info, Rent>,
//     pub clock: Sysvar<'info, Clock>,
//     pub system_program: Program<'info, System>,
//     pub token_program: Program<'info, Token>,
// }

/**
* State
*/
#[account]
pub struct BondPoolAccount {
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
    pub amount: u64,
    pub start_time: u64,
    pub end_time: u64,

    // Include also any bumps, etc.
    pub bump_bond_instance_account: u8,
    pub bump_bond_pool_account: u8,
    pub bump_bond_instance_solana_account: u8,
}


/**
 * Input Accounts
 */
// #[account]
// impl BondAccount {
//     pub const LEN: usize = 32   // initializer_key
//         + 32   // initializer_token_account
//         + 32   // initializer_solana_account
//         + 32   // bond solana account
//         + 32   // redeemable_mint
//         + 64   // amount
//         + 64   // time_frame
//         + 8 // bump_bond_solana_account
//         + 8 // bump_bond_authority
//         + 8 // bump_bond_account
//     ;
// }


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
}
