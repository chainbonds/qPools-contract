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
use std::convert::{TryFrom, TryInto};
use solana_sdk::{
    transaction::TransactionError,
    transport::TransportError,
    instruction::InstructionError,
};
use solana_sdk::{transaction::Transaction};

use solana_program_test::{ProgramTestContext};

pub struct qPoolsTest {
    pub context: ProgramTestContext, 
    pub rent: Rent,
    pub payer: Keypair,
    pub next_id: u8,
}

impl qPoolsTest {
    pub async fn start_new(program_test: solana_program_test::ProgramTest) -> Self {
        let mut context = program_test.start_with_context().await;
        let rent = context.banks_client.get_rent().await.unwrap();
        let payer = Keypair::from_bytes(&context.payer.to_bytes()).unwrap();
    
        Self {
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

    
}



