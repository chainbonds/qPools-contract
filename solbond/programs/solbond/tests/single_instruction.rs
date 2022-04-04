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
async fn create_and_init() {
    let program_id = ::solbond::id();
    let program_test = ProgramTest::new("solbond", ::solbond::id(), None);
    let mut test_context = program_test.start_with_context().await;
    //let (mut banks_client, payer, recent_blockhash) = program_test.start().await;
    let my_account_key = Keypair::new();
    let seeds: &[&[u8]] = &[&test_context.payer.pubkey().to_bytes(), PORTFOLIO_SEED];
    let (portfolio_acc_pubkey, portfolio_bump) = Pubkey::find_program_address(seeds, &program_id);
    let ix_accounts = ::solbond::accounts::SavePortfolio {
        owner:test_context.payer.pubkey(),
        portfolio_pda:portfolio_acc_pubkey, 
        rent: solana_program::sysvar::rent::id(),
        token_program:Token::id(), 
        system_program: solana_sdk::system_program::id(),
    };

    let ix_arg = ::solbond::instruction::CreatePortfolio {
        _bump: portfolio_bump,
        _sum_of_weights: 1 as u64,
        _num_positions: 1 as u32,
        _num_currencies: 1 as u32,
    };

    let ix = Instruction {
        program_id: program_id,
        accounts: ix_accounts.to_account_metas(Some(true)),
        data: ix_arg.data()
    };
    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&test_context.payer.pubkey()),
        &[&test_context.payer], 
        test_context.last_blockhash,
    );

    test_context
        .banks_client
        .process_transaction(tx)
        .await
        .unwrap();

    let portfolio_account = get_account::<PortfolioAccount>(test_context, portfolio_acc_pubkey).await;
    assert_eq!(portfolio_account.num_currencies, 1);
    assert_eq!(portfolio_account.bump, portfolio_bump);
    assert_eq!(portfolio_account.fully_created, false);
    assert_eq!(portfolio_account.to_be_redeemed, false);
    assert_eq!(portfolio_account.sum_of_weights, 1);
    assert_eq!(portfolio_account.num_redeemed, 0);
    assert_eq!(portfolio_account.num_created, 0);
    assert_eq!(portfolio_account.num_currencies_sent_back, 0);
    assert_eq!(portfolio_account.num_positions, 1);



    //let my_account_ai = test_context
    //    .banks_client
    //    .get_account(my_account_key.pubkey())
    //    .await
    //    .unwrap();
    //    //.unwrap();
    //let mut acc = test_context.banks_client.get_account(portfolio_acc_pubkey).await.unwrap().unwrap();
    ////let acc_info: AccountInfo = (&portfolio_acc_pubkey, &mut acc).into();
    //acc.data.drain(0..8);
    //try_from_slice_unchecked::<T>(&account.data).unwrap()

    //let acc_data = *::solbond
    //                ::accounts
    //                ::SavePortfolio::load(&acc_info).unwrap();
    //let acc_data = acc_info.data;
    //let data_slice = &mut my_account_ai.unwrap().data.as_slice();
    //println!("{}",my_account_ai);
    //let my_account = ::solbond
    //                 ::accounts
    //                 ::SavePortfolio
    //                 ::try_deserialize(&mut acc_info.data.as_slice()).unwrap();
    
    println!("kir");
    //assert_eq!(my_account.data, 1234);


}