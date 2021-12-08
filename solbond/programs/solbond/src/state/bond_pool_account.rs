use anchor_lang::prelude::*;

#[account]
pub struct BondPoolAccount {
    pub generator: Pubkey,

    pub bond_pool_redeemable_mint: Pubkey,
    pub bond_pool_token_mint: Pubkey,
    pub bond_pool_redeemable_token_account: Pubkey,
    pub bond_pool_token_account: Pubkey,

    // Include also any bumps, etc.
    pub bump_bond_pool_account: u8,
    pub bump_bond_pool_token_account: u8,
}

impl BondPoolAccount {
    pub const LEN: usize =
        32   // generator
            + 32   // bond_pool_redeemable_mint
            + 32   // bond_pool_token_mint
            + 32   // bond_pool_redeemable_token_account
            + 32   // bond_pool_token_account
            + 8   // bump_bond_pool_account
            + 8;   // bump_bond_pool_token_account

}
