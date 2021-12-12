use anchor_lang::prelude::*;

use amm::structs::pool::Pool;

#[account]
pub struct InvariantPoolList {
    pub pool_addresses: [Pubkey; 5],
    pub pool_weights: [u64; 5],

    // Do we need to add initializer, etc.?
    // I guess it makes sense if we only allow initialize to change this list
    pub initializer: Pubkey,
    pub _bump_pool_list: u8,
}
