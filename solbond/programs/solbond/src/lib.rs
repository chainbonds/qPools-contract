use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Mint, TokenAccount, Transfer, Token, MintTo};
use spl_token::instruction::AuthorityType;

const DECIMALS:u8 = 6;

declare_id!("7bg6EdDWgEwqDQAft4MfwBradFgFcHKqHbzECcB1i672");

#[program]
pub mod solbond {

    use super::*;

    const BOND_PDA_SEED: &[u8] = b"bond";

    pub fn initialize(
        ctx: Context<Initialize>,
        _time_frame: i64,
        _initializer_amount: u64,
        _bump: u8,
        _user_name: String
    ) -> ProgramResult {

        msg!("INITIALIZE BOND");

        /**
        * Assign Variables to the Bond Pool
        */
        let bond_account = &mut ctx.accounts.bond_account;

        bond_account.bump = _bump;
        bond_account.initializer_amount = _initializer_amount;
        bond_account.bond_time = _time_frame;

        bond_account.initializer_key = *ctx.accounts.initializer.key;

        bond_account.initializer_token_account = *ctx.accounts.initializer_token_account.to_account_info().key;
        bond_account.initializer_solana_account = *ctx.accounts.initializer_solana_account.to_account_info().key;
        bond_account.solana_holdings_account = *ctx.accounts.solana_holdings_account.to_account_info().key;
        bond_account.redeemable_mint = *ctx.accounts.redeemable_mint.to_account_info().key;

        /**
         * Transfer SOL from the initial user to his dedicated bond pool
         */
        let cpi_accounts = Transfer {
            from: ctx.accounts.initializer_solana_account.to_account_info(),
            to: ctx.accounts.solana_holdings_account.to_account_info(),
            authority: ctx.accounts.initializer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, _initializer_amount)?;

        /**
         * We do bookkeeping of how much SOL was paid in by minting the equivalent amount of tokens to the user
         */
        // Some seed & signer black magic
        let seeds = &[BOND_PDA_SEED, &[_bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts_mint = MintTo {
            mint: ctx.accounts.redeemable_mint.to_account_info(),
            to: ctx.accounts.initializer_token_account.to_account_info(),
            authority: ctx.accounts.initializer.to_account_info(),
        };
        let cpi_program_mint = ctx.accounts.token_program.to_account_info();
        let cpi_ctx_mint = CpiContext::new_with_signer(cpi_program_mint,
                                                       cpi_accounts_mint,
                                                       signer);
        token::mint_to(cpi_ctx_mint, _initializer_amount)?;


        Ok(())

    }

}

#[derive(Accounts)]
pub struct Initialize {}
