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




#[tokio::test]
async fn test_create_portfolio() {
    let program_id = crate::id();//crate::solbond::ID;//Pubkey::new_unique();
    let mut test = ProgramTest::new(
        "solbond",
        program_id,
        processor!(entry),
    );
    let (mut banks_client, payer, recent_blockhash) = test.start().await;
    let owner = Pubkey::new_unique();
    let seeds: &[&[u8]] = &[&payer.pubkey().to_bytes(), seeds::PORTFOLIO_SEED];
    let (portfolio_acc_pbk, portfolio_bump) = Pubkey::find_program_address(seeds, &program_id);

    let anc_acc = crate::accounts::SavePortfolio{
        owner: payer.pubkey(),
        portfolio_pda: portfolio_acc_pbk,
        system_program: solana_sdk::system_program::id(),
        token_program: Token::id(),
        rent: solana_program::sysvar::rent::id(),
    }.to_account_metas(None);

    let sumofweights = 1 as u64;
    let numpos = 2 as u32;
    let numcurre = 2 as u32;
    let data = crate::instruction::CreatePortfolio { 
        _bump: portfolio_bump,
        _sum_of_weights: sumofweights,
        _num_positions: numpos,
        _num_currencies: numcurre
    }.data();
    let ix = Instruction {
        program_id: program_id,
        accounts: anc_acc,
        data: data
    };


   let mut transaction = Transaction::new_with_payer(
        &[ix],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[&payer], recent_blockhash);
    assert_matches!(banks_client.process_transaction(transaction).await, Ok(()));



}