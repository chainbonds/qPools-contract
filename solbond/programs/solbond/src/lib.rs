//! Use docstrings as specified here: https://doc.rust-lang.org/rustdoc/how-to-write-documentation.html
use solana_program::program::invoke;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, TokenAccount, Token, MintTo};

const DECIMALS: u8 = 9;

declare_id!("Bqv9hG1f9e3V4w5BfQu6Sqf2Su8dH8Y7ZJcy7XyZyk4A");

#[program]
pub mod solbond {
    use super::*;

    const BOND_PDA_SEED: &[u8] = b"bond";

    pub fn initialize(
        ctx: Context<InitializeBond>,
        _bump: u8,
        _time_frame: u64,
        _initializer_amount: u64,
    ) -> ProgramResult {
        msg!("INITIALIZE BOND");

        if _initializer_amount <= 0 {
            return Err(ErrorCode::LowBondSolAmount.into());
        }

        /**
         * Transfer SOL from user to bond account
         */
        msg!("Transferring initializer-amount");
        let res = anchor_lang::solana_program::system_instruction::transfer(
            ctx.accounts.initializer.to_account_info().key,
            ctx.accounts.bond_account.to_account_info().key,
            _initializer_amount,
        );
        invoke(&res, &[ctx.accounts.initializer.to_account_info(), ctx.accounts.bond_account.to_account_info()]);

        /**
         * Track transferred SOL with redeemable tokens
         */
        msg!("Bump is: {}", _bump);
        let seeds = &[
            ctx.accounts.initializer.to_account_info().key.as_ref(),
            // BOND_PDA_SEED,
            &[_bump]
        ];
        let signer = &[&seeds[..]];
        let cpi_accounts = MintTo {
            mint: ctx.accounts.redeemable_mint.to_account_info(),
            to: ctx.accounts.initializer_token_account.to_account_info(),
            authority: ctx.accounts.bond_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(
            cpi_program,
            cpi_accounts,
            signer,
        );
        token::mint_to(cpi_ctx, _initializer_amount)?;

        msg!("MSG 1");

        /**
         * Assign Variables to the Bond Pool
         */
        let bond_account = &mut ctx.accounts.bond_account;

        // Arguments
        bond_account.bump = _bump;
        bond_account.initializer_amount = _initializer_amount;
        bond_account.bond_time = _time_frame;

        msg!("MSG 2");
        // Accounts
        bond_account.initializer = *ctx.accounts.initializer.key;
        bond_account.initializer_token_account = *ctx.accounts.initializer_token_account.to_account_info().key;
        bond_account.bond_token_account = *ctx.accounts.bond_token_account.to_account_info().key;
        msg!("MSG 3");
        bond_account.redeemable_mint = *ctx.accounts.redeemable_mint.to_account_info().key;
        bond_account.bond_authority = *ctx.accounts.bond_authority.to_account_info().key;

        msg!("MSG 4");
        // let amount = bond_account.initializer_amount;
        // let bump = bond_account.bump;

        Ok(())
    }

    pub fn redeem_bond(
        ctx: Context<RedeemBond>,
        _redeemable_amount: u64,
    ) -> ProgramResult {
        msg!("REDEEM BOND");

        let bond_account = &mut ctx.accounts.bond_account;

        // TODO: Have a bunch of constraints across bondAccount
        if bond_account.initializer_amount < _redeemable_amount {
            return Err(ErrorCode::RedeemCapacity.into());
        }

        /**
         * Burn Bond Token
         */
        let cpi_accounts = Burn {
            mint: ctx.accounts.redeemable_mint.to_account_info(),
            to: ctx.accounts.initializer_token_account.to_account_info(),
            authority: ctx.accounts.bond_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::burn(cpi_ctx, _redeemable_amount)?;

        /**
         * Pay out Solana
         */
        // let res = anchor_lang::solana_program::system_instruction::transfer(
        //     bond_account.bond_account,
        //     bond_account.initializer,
        //     _redeemable_amount,
        // );
        // invoke(&res, &[bond_account.bond_account.to_account_info(), bond_account.initializer.to_account_info()]);

        Ok(())
    }

    // pub fn redeem_bond(ctx: Context<RedeemBond>, amount: u64) -> ProgramResult {
    //
    //     /// Exchange the redeemable tokens for the SOL that was initially paid in
    //     // Some more signer and seed black magic
    //     let bump = bond_account.bump;
    //     let seeds = &[
    //         BOND_PDA_SEED,
    //         &[bump],
    //     ];
    //     let signer = &[&seeds[..]];
    //     let cpi_accounts = Burn {
    //         mint: ctx.accounts.redeemable_mint.to_account_info(),
    //         to: ctx.accounts.initializer_token_account.to_account_info(),
    //         authority: ctx.accounts.initializer.to_account_info(),
    //     };
    //
    //     let cpi_program_mint = ctx.accounts.token_program.to_account_info();
    //     let cpi_ctx = CpiContext::new_with_signer(
    //         cpi_program_mint,
    //         cpi_accounts,
    //         signer,
    //     );
    //     token::burn(cpi_ctx, amount)?;
    //
    //     Ok(())
    // }
}

/**
 * Input Accounts
 */
// _time_frame: u64,
#[derive(Accounts)]
#[instruction(
_bump: u8,
_time_frame: u64,
_initializer_amount: u64
)]
pub struct InitializeBond<'info> {
    /// @bond_account
    /// used to save the bond I guess the initializer will pay for the fees of calling this program
    #[account(init, payer = initializer, space = 8 + BondAccount::LEN)]
    pub bond_account: Account<'info, BondAccount>,

    /// @bond_signer
    /// PDA that signs all transactions by bond-account
    // #[account(mut)]
    #[account(mut, seeds = [initializer.key.as_ref()], bump = _bump)]
    pub bond_authority: AccountInfo<'info>,

    /// @distribution_authority
    /// authority that pays for all transactions
    #[account(signer, mut)]
    pub initializer: AccountInfo<'info>,

    /// @initializer_token_account
    /// the account holding the tokens the user will receive in exchange for the deposit has to be zero
    /// at initializiation what if multiple bonds? (multiple accounts, should be handled automatically? idk..)
    #[account(mut, constraint = initializer_token_account.amount == 0)]
    pub initializer_token_account: Account<'info, TokenAccount>,

    #[account(mut, constraint = bond_token_account.amount == 0)]
    pub bond_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub redeemable_mint: Account<'info, Mint>,

    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(
_redeemable_amount: u64
)]
pub struct RedeemBond<'info> {
    /// @bond_account
    /// used to save the bond I guess the initializer will pay for the fees of calling this program
    #[account(init, payer = initializer, space = 8 + BondAccount::LEN)]
    pub bond_account: Account<'info, BondAccount>,

    /// @bond_signer
    /// PDA that signs all transactions by bond-account
    // #[account(mut)]
    // seeds = [initializer.key.as_ref()], bump = _bump
    // #[account(mut)]
    #[account(seeds = [bond_account.initializer.as_ref()], bump = bond_account.bump)]
    pub bond_authority: AccountInfo<'info>,

    /// @distribution_authority
    /// authority that pays for all transactions
    #[account(signer, mut)]
    pub initializer: AccountInfo<'info>,

    /// @initializer_token_account
    /// the account holding the tokens the user will receive in exchange for the deposit has to be zero
    /// at initializiation what if multiple bonds? (multiple accounts, should be handled automatically? idk..)
    #[account(mut, constraint = initializer_token_account.amount == 0)]
    pub initializer_token_account: Account<'info, TokenAccount>,

    #[account(mut, constraint = bond_token_account.amount == 0)]
    pub bond_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub redeemable_mint: Account<'info, Mint>,

    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

// #[derive(Accounts)]
// pub struct RedeemBond<'info> {
//
//     #[account(mut)]
//     pub bond_token_account: Account<'info, TokenAccount>,
//
//     #[account(mut,
//     constraint = bond_account.initializer_solana_account == * initializer_solana_account.to_account_info().key,
//     constraint = bond_account.initializer_token_account == * bond_token_account.to_account_info().key,
//     constraint = bond_account.initializer_account == * initializer.to_account_info().key,
//     close = initializer
//     )]
//     pub bond_account: ProgramAccount<'info, BondAccount>,
//
//     #[account(
//     seeds = ["smt_jfh".as_bytes(), b"redeemable_mint".as_ref()],
//     bump = bond_account.bump,
//
//     )]
//     pub redeemable_mint: Account<'info, Mint>,
//
//     pub system_program: Program<'info, System>,
//     pub token_program: Program<'info, Token>,
//
// }


/**
 * Structs used as data structures
 */
#[account]
pub struct BondAccount {
    pub initializer: Pubkey,
    pub bond_authority: Pubkey,
    pub initializer_token_account: Pubkey,
    pub bond_token_account: Pubkey,
    pub redeemable_mint: Pubkey,
    pub initializer_amount: u64,
    pub bond_time: u64,
    pub bump: u8,
}

impl BondAccount {
    pub const LEN: usize = 32   // initializer_key
        + 32   // initializer_token_account
        + 32   // initializer_solana_account
        + 32   // solana_holdings_account
        // + 32   // redeemable_mint
        + 64   // amount
        + 64   // time_frame
        + 8;   // bump
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
}