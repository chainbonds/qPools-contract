use anchor_lang::prelude::*;

#[account]
pub struct TwoWayPoolAccount {

    pub generator: Pubkey,
    /// Basic struct for a LP Pool with two tokens and an LP token
    pub mint_a: Pubkey,
    pub mint_b: Pubkey,
    pub mint_lp: Pubkey,
    pub pool_token_account_a: Pubkey,
    pub pool_token_account_b: Pubkey,

    // Include also any bumps, etc.
    pub bump: u8,

    // include payed in amounts for easy reading
    // these amounts are only for displaying how much has been paid in
    // to the pools, they should never be used for redeeming or other functions
    // due to inaccuracies

    pub total_amount_in_a: u64,
    pub total_amount_in_b: u64,

}

impl TwoWayPoolAccount {
    pub const LEN: usize =
              32   // generator
            + 32   // mint_a
            + 32   // mint_b
            + 32   // mint_lp
            + 32   // pool_token_account_a
            + 32   // pool_token_account_b
            + 8    // bump
            + 64   // total_amount_in_a
            + 64;  // total_amount_in_b

}
