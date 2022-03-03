use anchor_lang::prelude::*;

#[account]
pub struct PositionAccount {

    // pubkey of user who owns the position 
    // pub owner: Pubkey,
    // /// Basic struct for a LP Pool positon with two tokens and an LP token
    // pub mint_a: Pubkey,
    // pub mint_b: Pubkey,
    // pub mint_lp: Pubkey,
    // pub owner_token_account_a: Pubkey,
    // pub owner_token_account_b: Pubkey,
    // pub owner_token_account_lp: Pubkey,

    // pda of pool where position is
    pub pool_pda: Pubkey,

    // is position already fulfilled or no?
    pub is_fulfilled: bool,

    // index of position in portfolio
    pub index: u32,
    // weight of this position in the portfolio
    pub weight: u64,
    // initial amount of tokens inputed into this specific position
    pub initial_token_amount: u64,

    pub pool_address: Pubkey,
    pub bump: u8,
    pub timestamp: i64,

}

impl PositionAccount {
    pub const LEN: usize =
            std::mem::size_of::<Pubkey>() * 2
            + std::mem::size_of::<u32>()   // pool_address
            + std::mem::size_of::<u64>() * 2     // bump
            + std::mem::size_of::<i64>()
            + std::mem::size_of::<bool>()
            + std::mem::size_of::<u8>();    // time


}
