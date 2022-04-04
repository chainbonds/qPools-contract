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
use spl_token::{state::*, *};
use solana_program::{program_option::COption,program_pack::Pack};

#[path = "./program_test.rs"]
mod program_test;

#[path = "./mints.rs"]
mod mints;
use mints::*;

#[path = "./state.rs"]
mod state;
//use state::*;


  
  

#[tokio::test]
async fn create_portfolio_instructions_test() {
    let program_id = ::solbond::id();
    let user = Keypair::new();
    let mut program_test = ProgramTest::new("solbond", ::solbond::id(), None);
    let mut program_test_obj = program_test::qPoolsTest::start_new(program_test, program_id).await;

    let (ix, portfolio_acc_pubkey, portfolio_bump) = program_test_obj.create_portfolio_ix(
        None,//Some(user.pubkey()),
        1 as u64,
        1 as u32, 
        1 as u32,
    );

    program_test_obj.process_transaction(&[ix], None).await;

    let portfolio_account = program_test_obj.get_account::<state::PortfolioAccount>(portfolio_acc_pubkey).await;
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

#[tokio::test]
async fn create_currency_pda_test() {
    let program_id = ::solbond::id();
    let user = Keypair::new();
    let mut program_test = ProgramTest::new("solbond", program_id, None);
    
    let mut program_test_obj = program_test::qPoolsTest::start_new(program_test, program_id).await;
    let test_amount: u64 = 21;
    let mint_key: Pubkey;
    let (ix, currency_acc_pubkey, currency_bump) = program_test_obj.initial_currency_ix(
        usdc_token::ID, test_amount
    );

    program_test_obj.process_transaction(&[ix], None).await;
    let currency_account = program_test_obj.get_account::<state::UserCurrencyAccount>(currency_acc_pubkey).await;

    assert_eq!(currency_account.withdraw_amount, 0);
    assert_eq!(currency_account.initial_amount, test_amount);
    assert_eq!(currency_account.bump, currency_bump);
}