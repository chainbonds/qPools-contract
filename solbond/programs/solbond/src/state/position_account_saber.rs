use anchor_lang::prelude::*;

#[account]
pub struct PositionAccountSaber {
    // TODO: Create an enum, which refers to which protocol it is part of
    // TODO: Or we should just normalize these positions to have the same keys
   
    pub portfolio_pda: Pubkey,
    pub pool_address: Pubkey,
    pub input_currency_mint: Pubkey,
    

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

impl PositionAccountSaber {
    pub const LEN: usize =
            std::mem::size_of::<Pubkey>() * 3 // portfolio_pda, pool_address
            + std::mem::size_of::<bool>()*3      // is_fulfilled
            + std::mem::size_of::<u32>()      // index
            + std::mem::size_of::<u64>() * 6   // weight, a_amount, b_amount, min_mint_amount
            + std::mem::size_of::<u8>()       // bump
            + std::mem::size_of::<i64>();     // time


}
