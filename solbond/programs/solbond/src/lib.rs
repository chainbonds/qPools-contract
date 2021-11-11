use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Mint, TokenAccount, Transfer};


declare_id!("GGoMTmrJtapovtdjZLv1hdbgZeF4pj8ANWxRxewnZ35g");

#[program]
pub mod solbond {
    use super::*;
    pub fn initialize(ctx: Context<InitializeBond>, _bond_account_bump: u8,
                      _time_frame: i64,
                      _deposit_amount: u64) -> ProgramResult {
        let bond_account = &mut ctx.accounts.bond_account;
        // bond_account.authority is the one who initializes the program
        // and has to pay for it 
        bond_account.authority = *ctx.accounts.authority.key;
        bond_account.nonce = _bond_account_bump;
        bond_account.deposit_amount = _deposit_amount;
        bond_account.time_frame = _time_frame;

        Ok(())
    }
    pub fn buy_bond(ctx: Context<BuyBond>) -> ProgramResult {

        let bond_account = &mut ctx.accounts.bond_account;

        let deposit_amount = bond_account.deposit_amount;
        let time_frame = bond_account.time_frame;

        token::transfer(
            ctx.accounts.into_transfer_to_initializer_context(),
            deposit_amount,
            )?;

        

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(bond_account_bump: u8, deposit_amount: u64)]
pub struct InitializeBond<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 // account discriminator
        + 32 // token_mint_account
        + 32 // buyer_solana_account
        + 32 // authority
        + 8 // nonce
        + 64 // time_frame
        + 64 // time_frame
     )]
    
    pub bond_account: ProgramAccount<'info, BondAccount>,

    // authority only has to be readable, since the key is read from it in initialize 
    pub authority : Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: AccountInfo<'info>,
    
    
}

#[derive(Accounts)]
pub struct BuyBond<'info> {
    #[account(signer)]
    pub signer_account: AccountInfo<'info>,
    #[account(mut)]
    pub buyer_solana_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub bond_solana_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub bond_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub initializer: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,


    #[account(mut, 
              constraint = bond_account.buyer_solana_account == *buyer_solana_account.to_account_info().key,
              constraint = bond_account.token_mint_account == *bond_token_account.to_account_info().key,
              constraint = bond_account.authority == *initializer.to_account_info().key,
              close = initializer
              )]
    pub bond_account: ProgramAccount<'info, BondAccount>,

}


#[account]
pub struct BondAccount {
    pub token_mint_account: Pubkey,
    pub buyer_solana_account: Pubkey,
    pub authority: Pubkey,
    pub nonce: u8,
    pub time_frame: i64,
    pub deposit_amount: u64
}





impl<'info> BuyBond<'info> {
    fn into_transfer_to_initializer_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.buyer_solana_account.to_account_info().clone(),
            to: self
                .bond_solana_account
                .to_account_info()
                .clone(),
            authority: self.signer_account.clone(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}
