use anchor_lang::prelude::*;

use anchor_spl::token::{self,TokenAccount};

#[account]
pub struct PortfolioAccount {
    // pubkey of user who owns the position 
    pub weights: [u64; 3],
    pub owner: Pubkey,
    pub bump: u8,
}






impl PortfolioAccount {
    pub const LEN: usize = 
    std::mem::size_of::<Pubkey>() + 3*8 + 1;

}
