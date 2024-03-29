use anchor_lang::prelude::*;


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






impl PortfolioAccount {
    pub const LEN: usize = 
    std::mem::size_of::<Pubkey>() + 
    std::mem::size_of::<u8>() + 
    std::mem::size_of::<bool>()*2 +
    std::mem::size_of::<u64>() +
    std::mem::size_of::<u32>()*5 +
    std::mem::size_of::<i64>()*2;
}
