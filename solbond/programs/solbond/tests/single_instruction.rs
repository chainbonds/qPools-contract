use anchor_lang::{
    prelude::*, solana_program::instruction::Instruction, InstructionData
};
//use ::solbond::*;
use solana_program_test::*;
use solana_sdk::{signature::Keypair, signer::Signer, transaction::Transaction};
use anchor_spl::token::{Token};
use solana_sdk::{
    rent::{Rent},
    system_instruction,
    program_error::ProgramError,
    clock::{Clock, UnixTimestamp},
    pubkey::Pubkey,
    borsh::{try_from_slice_unchecked},
};

#[path = "./program_test.rs"]
mod program_test;

#[path = "./seeds.rs"]
mod seeds;

#[path = "./state.rs"]
mod state;
use seeds::*;
use state::*;


pub async fn get_account<T>(mut test_context: ProgramTestContext, account: Pubkey) -> T
  where T: borsh::de::BorshDeserialize
  {
    let mut account = test_context.banks_client.get_account(account).await.unwrap().unwrap();
    // Note! the first 8 bytes represent the Anchor account discriminator so we need to get rid of it first
    account.data.drain(0..8);
    
    try_from_slice_unchecked::<T>(&account.data).unwrap()
  }



  
  

#[tokio::test]
async fn create_portfolio_instructions_test() {
    let program_id = ::solbond::id();
    let program_test = ProgramTest::new("solbond", ::solbond::id(), None);
    let mut program_test_obj = program_test::qPoolsTest::start_new(program_test).await;

    let (ix, portfolio_acc_pubkey, portfolio_bump) = program_test_obj.create_portfolio_ix(
        program_id,
        1 as u64,
        1 as u32, 
        1 as u32,
    );

    program_test_obj.process_transaction(&[ix], None).await;


    let portfolio_account = program_test_obj.get_account::<PortfolioAccount>(portfolio_acc_pubkey).await;
    assert_eq!(portfolio_account.num_currencies, 1);
    assert_eq!(portfolio_account.bump, portfolio_bump);
    assert_eq!(portfolio_account.fully_created, false);
    assert_eq!(portfolio_account.to_be_redeemed, false);
    assert_eq!(portfolio_account.sum_of_weights, 1);
    assert_eq!(portfolio_account.num_redeemed, 0);
    assert_eq!(portfolio_account.num_created, 0);
    assert_eq!(portfolio_account.num_currencies_sent_back, 0);
    assert_eq!(portfolio_account.num_positions, 1);


}