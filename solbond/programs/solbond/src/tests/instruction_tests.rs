#![cfg(feature = "test-bpf")]
use {
    assert_matches::*,
    solana_program::instruction::{AccountMeta, Instruction},
    solana_program_test::*,
    solana_sdk::{signature::Signer, transaction::Transaction},
    anchor_lang::prelude::*,

};
use crate::solbond::*;
use crate::instructions;
use crate::utils;
use crate::state;
use crate::entry;
//use solbond::accounts::{SavePortfolio};
use crate::utils::seeds;
use anchor_spl::token::{Token};
use anchor_lang::InstructionData;
use super::instruction_builder::*;


#[tokio::test]
async fn test_create_portfolio() {
    let program_id = crate::id();//crate::solbond::ID;//Pubkey::new_unique();
    let mut test = ProgramTest::new(
        "solbond",
        program_id,
        processor!(entry),
    );
    let (mut banks_client, payer, recent_blockhash) = test.start().await;

    let ix = create_portfolio_ix(payer.pubkey(), 1 as u64, 2 as u32, 2 as u32).unwrap();

   let mut transaction = Transaction::new_with_payer(
        &[ix],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[&payer], recent_blockhash);
    assert_matches!(banks_client.process_transaction(transaction).await, Ok(()));
}



#[tokio::test]
async fn test_create_currency_pda() {
    let program_id = crate::id();//crate::solbond::ID;//Pubkey::new_unique();
    let mut test = ProgramTest::new(
        "solbond",
        program_id,
        processor!(entry),
    );
    let (mut banks_client, payer, recent_blockhash) = test.start().await;
    let some_amount: u64 = 2; // arbitrary 


        
    let ix = approve_initial_currency_ix(payer.pubkey(), some_mint_key, some_amount).unwrap();
    let mut transaction = Transaction::new_with_payer(
        &[ix],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[&payer], recent_blockhash);
    assert_matches!(banks_client.process_transaction(transaction).await, Ok(()));
    }
