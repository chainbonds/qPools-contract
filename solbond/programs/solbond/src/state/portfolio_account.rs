use anchor_lang::prelude::*;
use crate::state::position_account::{PositionAccount};
use crate::state::two_way_pool_account::{TwoWayPoolAccount};

#[account]
pub struct PortfolioAccount {

    // pubkey of user who owns the position 
    pub position_one_pda: Pubkey,
    pub position_two_pda: Pubkey,
    pub position_three_pda: Pubkey,

    pub pool_one_pda: Pubkey,
    pub pool_two_pda: Pubkey,
    pub pool_three_pda: Pubkey,

    pub user_lp_token_account_one: Pubkey,
    pub user_lp_token_account_two: Pubkey,
    pub user_lp_token_account_three: Pubkey,

    pub owner: Pubkey,
    pub bump: u8,

}




impl PortfolioAccount {
    pub const LEN: usize = 
    32 * 10 + 8;

}
