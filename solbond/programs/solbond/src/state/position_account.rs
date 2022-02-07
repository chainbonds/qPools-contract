use anchor_lang::prelude::*;

#[account]
pub struct PositionAccount {

    // pubkey of user who owns the position 
    pub owner: Pubkey,
    /// Basic struct for a LP Pool positon with two tokens and an LP token
    pub mint_a: Pubkey,
    pub mint_b: Pubkey,
    pub mint_lp: Pubkey,
    pub owner_token_account_a: Pubkey,
    pub owner_token_account_b: Pubkey,
    pub owner_token_account_lp: Pubkey,

    // pda of pool where position is
    pub pool_pda: Pubkey,

    // Include also any bumps, etc.
    pub bump: u8,

}

impl PositionAccount {
    pub const LEN: usize =
              32   // position owner
            + 32   // mint_a
            + 32   // mint_b
            + 32   // mint_lp
            + 32   // pool_token_account_a
            + 32   // pool_token_account_b
            + 32   // pool_token_account_lp
            + 32   // pool_pda
            + 8;    // bump


}
