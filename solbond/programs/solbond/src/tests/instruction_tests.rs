use {
    super::*, 
    assert_matches::*,
    solana_program::instruction::{AccountMeta, Instruction},
    solana_program_test::*,
    solana_sdk::{signature::Signer, transaction::Transaction},
    anchor_lang::prelude::*,

};
use crate::solbond::*;

#[tokio::test]
async fn test_health_check() {
    let program_id = Pubkey::new_unique();
    let (mut banks_client, payer, recent_blockhash) = ProgramTest::new(
        "solbond",
        program_id,
        processor!(solana_test_healthcheck),
    )
    .start()
    .await;

    let mut transaction = Transaction::new_with_payer(
        &[Instruction {
            program_id,
            accounts: vec![AccountMeta::new(payer.pubkey(),false)],
            data: vec![1,2,3],
        }],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[&payer], recent_blockhash);

    assert_matches!(banks_client.process_transaction(transaction).await, Ok(()));
}