use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_lang::solana_program::system_program;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

use amm::cpi::accounts::CreatePositionList;
use amm::program::Amm;
use amm::cpi;
use amm::{self, PositionList};

use crate::ErrorCode;
use crate::state::BondPoolAccount;
use crate::utils::functional::calculate_redeemables_to_be_distributed;

#[derive(Accounts)]
#[instruction(
    position_list_bump: u8,
    _bump_bond_pool_account: u8
)]
pub struct CreateLiquidityPositionList<'info> {

    pub position_list: AccountLoader<'info, PositionList>,
    pub bond_pool_account: AccountInfo<'info>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,

    pub invariant_program: Program<'info,Amm>,

    // The standard accounts
    pub clock: Sysvar<'info, Clock>,
    pub token_program: Program<'info, Token>,
}

/**
    Deposit reserve to pools.
    All the Solana tokens that are within the reserve,
    are now put into
 */
pub fn handler(
    ctx: Context<CreateLiquidityPositionList>,
    position_list_bump: u8,
    _bump_bond_pool_account: u8
) -> ProgramResult {
    msg!("Depositing reserve to pools!");
    // TODO: Create position list if it doesn't exist yet
    // If there is already a positionlist, skip this step!

    let create_position_list_accounts = CreatePositionList {
        // ctx.accounts.state.to_account_info()
        // position_list: ctx.accounts.position_list,
        position_list: ctx.accounts.position_list.to_account_info(),
        // Should be the bond-pool-account
        owner: ctx.accounts.bond_pool_account.to_account_info(),
        // Program will sign this
        signer: ctx.accounts.signer.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    };
    let invariant_program = ctx.accounts.invariant_program.to_account_info();

    // Also make the signer sign it

    // The program is the signer
    amm::cpi::create_position_list(
        CpiContext::new_with_signer(
            invariant_program,
            create_position_list_accounts,
            &[
                [
                    ctx.accounts.bond_pool_account.key.as_ref(), b"bondPoolAccount",
                    &[_bump_bond_pool_account]
                ].as_ref()
            ]
        ),
        position_list_bump
    );

    // ctx.accounts.bond_pool_account.key.as_ref(), b"bondPoolAccount",
    // &[_bump_bond_pool_account]

    Ok(())
}