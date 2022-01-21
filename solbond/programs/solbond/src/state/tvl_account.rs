use anchor_lang::prelude::*;

#[account]
pub struct TvlInfoAccount {
    pub tvl_in_usdc: u64
}
