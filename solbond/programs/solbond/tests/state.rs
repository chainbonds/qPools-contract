use anchor_lang::prelude::*;

declare_id!("EUBBaxNut3Z79MxGFTa4DsfUdAkdrwEP7b7Zc1W9Hj2H");

#[account]
pub struct PortfolioAccount {
    // pubkey of user who owns the position 
    pub owner: Pubkey,
    pub bump: u8,

    pub to_be_redeemed: bool,
    pub fully_created: bool,
    //pub all_positions_redeemed: bool,

    // pub initial_amount_usdc: u64,
    // pub withdraw_amount_usdc: u64,

    // pub initial_amount_sol: u64,
    // pub withdraw_amount_sol: u64,
    pub sum_of_weights: u64,

    pub num_redeemed: u32,
    pub num_positions: u32,
    pub num_created: u32,

    pub num_currencies: u32,
    pub num_currencies_sent_back: u32,



    // time when portfolio signed
    pub start_timestamp: i64,

    // time when portfolio is fulfilled
    pub fulfilled_timestamp: i64,


    //pub pool_address_1: Pubkey,

}

#[account]
pub struct PositionAccountMarinade {

   
    pub portfolio_pda: Pubkey,
    //pub marinade_position_sol_account: Pubkey,
    

    // is position already fulfilled or no?
    pub is_fulfilled: bool,
    pub is_redeemed: bool,
    pub redeem_approved: bool,

    // index of position in portfolio
    pub index: u32,
    // weight of this position in the portfolio
    pub weight: u64,

    // initial amount of tokens inputed into this specific position
    pub initial_sol_amount: u64,
    pub msol_out_amount: u64,

    // stuff for redeem
    pub withdraw_sol_amount: u64,

    pub bump: u8,
    pub timestamp: i64,

    

}

#[account]
pub struct PositionAccountSaber {
    // TODO: Create an enum, which refers to which protocol it is part of
    // TODO: Or we should just normalize these positions to have the same keys
   
    pub portfolio_pda: Pubkey,
    pub pool_address: Pubkey,
    

    // is position already fulfilled or no?
    pub is_fulfilled: bool,
    pub is_redeemed: bool,
    pub redeem_approved: bool,

    // index of position in portfolio
    pub index: u32,
    // weight of this position in the portfolio
    pub weight: u64,

    // initial amount of tokens inputed into this specific position
    pub max_initial_token_a_amount: u64,
    pub max_initial_token_b_amount: u64,
    pub min_mint_amount: u64,

    // stuff for redeem
    pub pool_token_amount: u64,
    pub minimum_token_amount_out: u64,
    //pub minimum_token_b_amount: u64,

    pub bump: u8,
    pub timestamp: i64,

    

}


#[account]
pub struct PositionAccountSolend {

   
    pub portfolio_pda: Pubkey,
    pub currency_mint: Pubkey,
    //pub marinade_position_sol_account: Pubkey,
    

    // is position already fulfilled or no?
    pub is_fulfilled: bool,
    pub is_redeemed: bool,
    pub redeem_approved: bool,

    // index of position in portfolio
    pub index: u32,
    // weight of this position in the portfolio
    pub weight: u64,

    // initial amount of tokens inputed into this specific position
    pub initial_amount: u64,

    // stuff for redeem
    pub withdraw_amount: u64,

    pub bump: u8,
    pub timestamp: i64,

}



#[account]
pub struct UserCurrencyAccount {
    // pubkey of user who owns the position 
    pub owner: Pubkey,
    pub bump: u8,

    pub initial_amount: u64,
    pub withdraw_amount: u64,
    pub mint: Pubkey,

    // pub index: u32, add this in if useful

}


