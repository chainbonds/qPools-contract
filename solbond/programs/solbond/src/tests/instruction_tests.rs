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


#[tokio::test]
async fn test_create_portfolio() {
    let program_id = Pubkey::new_unique();
    let mut test = ProgramTest::new(
        "solbond",
        program_id,
        processor!(entry),
    );
    let (mut banks_client, payer, recent_blockhash) = test.start().await;
    let owner = Pubkey::new_unique();
    let seeds: &[&[u8]] = &[&owner.as_ref(), seeds::PORTFOLIO_SEED];
    let (portfolio_acc_pbk, portfolio_bump) = Pubkey::find_program_address(seeds, &program_id);

    let save_portfolio_accs = vec![
        AccountMeta::new_readonly(owner, true),
        AccountMeta::new(portfolio_acc_pbk, false),
        AccountMeta::new_readonly(solana_sdk::system_program::id(),false),
        AccountMeta::new_readonly(spl_token::id(), false),
        AccountMeta::new_readonly(solana_program::sysvar::rent::id(),false)

    ];
    let anc_acc = crate::accounts::SavePortfolio{
        owner: owner,
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
    };
    //let create_portfolio_ix = Instruction {
    //    program_id: program_id,
    //    accounts: save_portfolio_accs,
    //    data: &entrypoint::instructions::approve::approve_portfolio_weights::handler(
    //    )
    //}

    // let save_portfolio_ctx = SavePortfolio {
    //     owner:owner,
    //     portfolio_pda: portfolio_acc_pbk,
    //     system_program: &solana_sdk::system_program::id(),
    //     token_program: &spl_token::ID,
    //     rent: &Rent::get()?,
    // };


   

}