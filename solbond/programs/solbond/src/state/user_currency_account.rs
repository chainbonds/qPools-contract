use anchor_lang::prelude::*;


#[account]
pub struct UserCurrencyAccount {
    // pubkey of user who owns the position 
    pub owner: Pubkey,
    pub bump: u8,

    pub initial_amount: u64,
    pub withdraw_amount: u64,
    pub mint: Pubkey,

}






impl UserCurrencyAccount {
    pub const LEN: usize = 
    std::mem::size_of::<Pubkey>()*2 + 
    std::mem::size_of::<u8>() + 
    std::mem::size_of::<u64>()*2;
}
