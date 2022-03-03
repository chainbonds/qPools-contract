use anchor_lang::prelude::*;

use anchor_spl::token::{self,TokenAccount};

#[account]
pub struct PortfolioAccount {
    // pubkey of user who owns the position 
    pub owner: Pubkey,
    pub bump: u8,

    pub initial_amount_USDC: u64,
}






impl PortfolioAccount {
    pub const LEN: usize = 
    std::mem::size_of::<Pubkey>() + std::mem::size_of::<u8>() + std::mem::size_of::<u64>();

}
