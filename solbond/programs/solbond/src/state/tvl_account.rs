use anchor_lang::prelude::*;

#[account]
pub struct TvlInfoAccount {
    pub tvl_mint: Pubkey,
    pub tvl_in_usdc: u64,
    pub decimals: u8,
}
