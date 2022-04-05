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


#[tokio::test]
async fn approve_buy_saber_test() {
    let program_id = ::solbond::id();
    let mut program_test = ProgramTest::new("solbond", program_id,None);
    let mut program_test_obj = program_test::qPoolsTest::start_new(program_test, program_id).await;
    let (ix, portfolio_acc_pubkey, portfolio_bump) = program_test_obj.create_portfolio_ix(
        None,//Some(user.pubkey()),
        1 as u64,
        1 as u32, 
        1 as u32,
    );

    program_test_obj.process_transaction(&[ix], None).await;
    let rand_amount_a: u64 = 100;
    let rand_amount_b: u64 = 0;
    let rand_min_mint_amount: u64 = 102;
    let weight: u64= 1;
    let index:u32 = 0; 
    let (ix_sab, position_acc_pubkey, position_bump) = program_test_obj.approve_saber_buy_tx(
        None,
        index, 
        saber_usdc_lp_token::ID, 
        weight, 
        rand_amount_a,
        rand_amount_b, 
        rand_min_mint_amount,
    );
    program_test_obj.process_transaction(&[ix_sab], None).await;

    let saber_position_account = program_test_obj.get_account::<state::PositionAccountSaber>(position_acc_pubkey).await;

    assert_eq!(saber_position_account.index,index);
    assert_eq!(saber_position_account.weight,weight);
    assert_eq!(saber_position_account.max_initial_token_a_amount, rand_amount_a);
    assert_eq!(saber_position_account.max_initial_token_b_amount, rand_amount_b);
    assert_eq!(saber_position_account.min_mint_amount, rand_min_mint_amount);
    assert_eq!(saber_position_account.pool_token_amount,0);
    assert_eq!(saber_position_account.minimum_token_amount_out,0);
    assert_eq!(saber_position_account.is_fulfilled, false);
    assert_eq!(saber_position_account.is_redeemed, false);
    assert_eq!(saber_position_account.redeem_approved, false);
    assert_eq!(saber_position_account.bump, position_bump);
    assert_eq!(saber_position_account.pool_address,saber_usdc_lp_token::ID);
    assert_eq!(saber_position_account.portfolio_pda,portfolio_acc_pubkey);

}


#[tokio::test]
async fn approve_buy_marinade() {
    let program_id = ::solbond::id();
    let mut program_test = ProgramTest::new("solbond", program_id,None);
    let mut program_test_obj = program_test::qPoolsTest::start_new(program_test, program_id).await;
    let (ix, portfolio_acc_pubkey, portfolio_bump) = program_test_obj.create_portfolio_ix(
        None,//Some(user.pubkey()),
        1 as u64,
        1 as u32, 
        1 as u32,
    );
    program_test_obj.process_transaction(&[ix], None).await;
    let index:u32 = 0;
    let weight: u64 = 1;
    let init_lamports = 1000000000;
    let (ix_mar, position_acc_pubkey, position_bump, marinade_pubkey, marinade_bump) = program_test_obj.approve_marinade_buy_tx(
        None,
        index, 
        weight, 
        init_lamports,
    );
    
    let amount_owner_before = 
    program_test_obj.context.banks_client.get_account(program_test_obj.payer.pubkey()).await.unwrap().unwrap().lamports;
    //let amount_pda_before = program_test_obj.context.banks_client.get_account(marinade_pubkey).await.unwrap().unwrap().lamports;
    program_test_obj.payer.pubkey();
    program_test_obj.process_transaction(&[ix_mar], None).await;
    let marinade_position_account = program_test_obj.get_account::<state::PositionAccountMarinade>(position_acc_pubkey).await;

    assert_eq!(marinade_position_account.index,index);
    assert_eq!(marinade_position_account.weight , weight);
    assert_eq!(marinade_position_account.initial_sol_amount, init_lamports);
    assert_eq!(marinade_position_account.withdraw_sol_amount, 0);
    assert_eq!(marinade_position_account.is_fulfilled, false);
    assert_eq!(marinade_position_account.is_redeemed, false);
    assert_eq!(marinade_position_account.redeem_approved, false);
    assert_eq!(marinade_position_account.bump, position_bump);
    assert_eq!(marinade_position_account.portfolio_pda, portfolio_acc_pubkey);


    let amount_owner_after = 
    program_test_obj.context.banks_client.get_account(program_test_obj.payer.pubkey()).await.unwrap().unwrap().lamports;
    let amount_pda_after = program_test_obj.context.banks_client.get_account(marinade_pubkey).await.unwrap().unwrap().lamports;


    
    // check if transfer worked

    assert!(amount_pda_after >= init_lamports, "transfered amount less than what was specified");
    assert!(amount_owner_after < amount_owner_before, "owner got money from nowhere");
    assert!(amount_owner_before - amount_owner_after >= init_lamports, "math doesn't check out");
}