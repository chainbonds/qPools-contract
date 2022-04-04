use anchor_lang::{
    prelude::*, solana_program::instruction::Instruction, InstructionData
};
use solana_sdk::{
  rent::{Rent},
  system_instruction,
  program_error::ProgramError,
  clock::{Clock, UnixTimestamp},
  pubkey::Pubkey,
  signature::{Keypair, Signer},
  borsh::{try_from_slice_unchecked},
};
use anchor_spl::token::{Token};

#[path = "./seeds.rs"]
mod seeds;
use seeds::*;

use std::convert::{TryFrom, TryInto};
use solana_sdk::{
    transaction::TransactionError,
    transport::TransportError,
    instruction::InstructionError,
};
use solana_sdk::{transaction::Transaction};
use solana_program_test::*;
use solana_program_test::{ProgramTestContext};
use solana_program::{program_option::COption,program_pack::Pack};
use spl_token::{state::*, *};
#[path = "./mints.rs"]
mod mints;
use mints::*;

// copied from mango
trait AddPacked {
    fn add_packable_account<T: Pack>(
        &mut self,
        pubkey: Pubkey,
        amount: u64,
        data: &T,
        owner: &Pubkey,
    );
}

impl AddPacked for ProgramTest {
    fn add_packable_account<T: Pack>(
        &mut self,
        pubkey: Pubkey,
        amount: u64,
        data: &T,
        owner: &Pubkey,
    ) {
        let mut account = solana_sdk::account::Account::new(amount, T::get_packed_len(), owner);
        data.pack_into_slice(&mut account.data);
        self.add_account(pubkey, account);
    }
}
pub struct qPoolsTest {
    pub program_id: Pubkey,
    pub context: ProgramTestContext, 
    pub rent: Rent,
    pub payer: Keypair,
    pub next_id: u8,
}

impl qPoolsTest {
    pub async fn start_new(mut program_test: solana_program_test::ProgramTest, program_id: Pubkey) -> Self {
        program_test.add_packable_account(
            usdc_token::ID,
            u32::MAX as u64,
            &Mint {
                is_initialized: true,
                mint_authority: COption::Some(Pubkey::new_unique()),
                decimals: 6,
                ..Mint::default()
            },
            &spl_token::id(),
        );
        let mut context = program_test.start_with_context().await;
        let rent = context.banks_client.get_rent().await.unwrap();
        let payer = Keypair::from_bytes(&context.payer.to_bytes()).unwrap();

        // add usdc mint account 
        
    
        Self {
          program_id,
          context,
          rent,
          payer,
          next_id: 0,
        }
    }

    pub async fn get_account<T>(&mut self, account: Pubkey) -> T
  where T: borsh::de::BorshDeserialize
  {
    let mut account = self.context.banks_client.get_account(account).await.unwrap().unwrap();
    // Note! the first 8 bytes represent the Anchor account discriminator so we need to get rid of it first
    account.data.drain(0..8);
    
    try_from_slice_unchecked::<T>(&account.data).unwrap()
  }

  pub async fn process_transaction(
    &mut self,
    instructions: &[Instruction],
    signers: Option<&[&Keypair]>,
  ) -> Result<(), ProgramError> {
    let mut transaction = Transaction::new_with_payer(instructions, Some(&self.payer.pubkey()));
    let mut all_signers = vec![&self.payer];

    if let Some(signers) = signers {
      all_signers.extend_from_slice(signers);
    }

    let recent_blockhash = self
      .context
      .banks_client
      .get_latest_blockhash()
      .await
      .unwrap();

    transaction.sign(&all_signers, recent_blockhash);

    self.context
      .banks_client
      .process_transaction(transaction)
      .await
      .map_err(|e| solana_program::log::sol_log(&e.to_string()));

    Ok(())
  }


  pub async fn create_account(&mut self, space: u64, owner: &Pubkey) -> Keypair {
    let account = Keypair::new();
    let create_ix = system_instruction::create_account(
      &self.payer.pubkey(),
      &account.pubkey(),
      100_000_000_000_000,
      space,
      owner,
    );

    self.process_transaction(&[create_ix], Some(&[&account]))
      .await
      .unwrap();

    account
  }

  pub fn create_portfolio_ix(&self, owner: Option<Pubkey>, _sum_of_weights: u64, _num_positions: u32, _num_currencies: u32) -> (Instruction,Pubkey, u8) {
    let owner_key: Pubkey;
    if owner.is_none() {
        owner_key = self.payer.pubkey();
    } else {
        owner_key = owner.unwrap();
    }
    let seeds: &[&[u8]] = &[&owner_key.to_bytes(), PORTFOLIO_SEED];
    let (portfolio_acc_pubkey, portfolio_bump) = Pubkey::find_program_address(seeds, &self.program_id);
    println!("owner key {}", owner_key.to_string());
    println!("portfolio key {}", portfolio_acc_pubkey.to_string());
    
    let ix_accounts = ::solbond::accounts::SavePortfolio {
        owner:owner_key,
        portfolio_pda:portfolio_acc_pubkey, 
        rent: solana_program::sysvar::rent::id(),
        token_program:Token::id(), 
        system_program: solana_sdk::system_program::id(),
    };

    let ix_arg = ::solbond::instruction::CreatePortfolio {
        _bump: portfolio_bump,
        _sum_of_weights: _sum_of_weights,
        _num_positions: _num_positions,
        _num_currencies: _num_currencies,
    };

    (
        Instruction {
        program_id: self.program_id,
        accounts: ix_accounts.to_account_metas(Some(true)),
        data: ix_arg.data()
        },
        portfolio_acc_pubkey,
        portfolio_bump
    )

  }


  pub fn initial_currency_ix(&self, mint_pubkey: Pubkey, amount: u64) -> (Instruction, Pubkey, u8) {

    let seeds: &[&[u8]] = &[&self.payer.pubkey().to_bytes(), &mint_pubkey.to_bytes(),USER_CURRENCY_STRING];
    let (currency_acc_pubkey, currency_bump) = Pubkey::find_program_address(seeds, &self.program_id);

    let ix_accounts = ::solbond::accounts::ApproveInitialCurrencyAmount {
        owner: self.payer.pubkey(),
        user_currency_pda_account: currency_acc_pubkey,
        currency_mint: mint_pubkey, 
        system_program: solana_sdk::system_program::id(),
        rent: solana_program::sysvar::rent::id(),
    };

    let ix_arg = ::solbond::instruction::ApproveInitialCurrencyAmount {
        _bump_user_currency: currency_bump,
        _input_amount_currency: amount,

    };

    (
        Instruction {
            program_id: self.program_id,
            accounts: ix_accounts.to_account_metas(Some(true)),
            data: ix_arg.data(),
        },
        currency_acc_pubkey,
        currency_bump,
    )


  }

    
}



