use anchor_lang::prelude::*;

use amm::structs::pool::Pool;

// , AnchorSerialize, AnchorDeserialize

#[account]
#[derive(PartialEq, Default, Debug)]
pub struct InvariantPoolList {
    // pub pool_list: [Box<Pool>; 1],
    pub pool_list: Pool,
    // pub pool_list: Vec<Pool>

    // pub pool_list: Vec<Pubkey>  // Compiles, runtime crashes
}

// impl BondPoolAccount {
//     pub const LEN: usize =
//         32   // generator
//             + 32   // bond_pool_redeemable_mint
//             + 32   // bond_pool_token_mint
//             + 32   // bond_pool_redeemable_token_account
//             + 32   // bond_pool_token_account
//             + 8   // bump_bond_pool_account
//             + 8;   // bump_bond_pool_token_account
//
// }
