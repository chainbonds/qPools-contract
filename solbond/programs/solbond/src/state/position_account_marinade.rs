use anchor_lang::prelude::*;

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

    //pub min_deposit_when_approved: u64,

    

}

impl PositionAccountMarinade {
    pub const LEN: usize =
            std::mem::size_of::<Pubkey>()  // portfolio_pda, pool_address
            + std::mem::size_of::<bool>()*3      // is_fulfilled
            + std::mem::size_of::<u32>()      // index
            + std::mem::size_of::<u64>() * 4   // weight, a_amount, b_amount, min_mint_amount
            + std::mem::size_of::<u8>()       // bump
            + std::mem::size_of::<i64>();     // time


}
