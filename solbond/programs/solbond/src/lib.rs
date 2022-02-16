//! Use docstrings as specified here: https://doc.rust-lang.org/rustdoc/how-to-write-documentation.html
mod instructions;
mod utils;
mod state;

use anchor_lang::prelude::*;
use anchor_spl::token::{Token};

use instructions::*;
declare_id!("HdWi7ZAt1tmWaMJgH37DMqAMqBwjzt56CtiKELBZotrc");



#[derive(Accounts)]
#[instruction(
_bump_bond_pool_account: u8,
_bump_bond_pool_solana_account: u8
)]
pub struct BalancePools<'info> {

    // The standards accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[program]
pub mod solbond {
    use super::*;

    /**
    * A simple health checkpoint which checks if the program is up and running
    */
    pub fn healthcheck(ctx: Context<Healthcheck>) -> ProgramResult {
        instructions::healthcheck::handler(ctx)
    }

    /**
    * Initializes the reserve / vault
    */
    pub fn initialize_pool_account(
        ctx: Context<InitializeLpPoolAccount>,
        _bump: u8,
    ) -> ProgramResult {
        instructions::initialize_lp_pool::handler(ctx,_bump)
    }


    pub fn create_position_saber(
        ctx: Context<SaberLiquidityInstruction>,
        _bump_pool: u8,
        _bump_position: u8,
        _bump_portfolio: u8,
        _index:u32,
        _weight: u64,
        token_a_amount: u64,
        token_b_amount: u64,
        min_mint_amount: u64,

    ) -> ProgramResult {
        instructions::create_position_saber::handler(
            ctx, 
            _bump_pool, 
            _bump_position,
            _bump_portfolio,
            _index, 
            _weight,
            token_a_amount,
            token_b_amount,
            min_mint_amount,)
    }

    pub fn save_portfolio(
        ctx: Context<SavePortfolio>,
        bump: u8,
        weights: [u64; 3]
    ) -> ProgramResult {
        instructions::create_portfolio::handler(ctx, bump, weights)
    }

    pub fn redeem_position_saber(
        ctx: Context<RedeemSaberPosition>,
        _bump_portfolio: u8,
    _bump_position: u8,
    _index: u32,
    min_mint_amount: u64,
    token_a_amount: u64,
    token_b_amount: u64,
    ) -> ProgramResult {
        instructions::redeem_position_saber::handler(ctx, _bump_portfolio,
        _bump_position, _index, min_mint_amount, token_a_amount, token_b_amount)
    }


    pub fn redeem_position_one_saber(
        ctx: Context<RedeemOneSaberPosition>,
        _bump_portfolio: u8,
        _bump_position: u8,
        _index: u32,
        lp_amount: u64,
        token_amount: u64,
    ) -> ProgramResult {
        instructions::redeem_position_one_saber::handler(ctx, _bump_portfolio,
        _bump_position, _index, lp_amount, token_amount)
    }
    
    

    pub fn transfer_to_portfolio(
        ctx: Context<TransferToPortfolio>,
        bump: u8, amount: u64) -> ProgramResult {
            instructions::transfer_to_portfolio::handler(ctx,bump,amount)
        }
    
    pub fn transfer_redeemed_to_user(
        ctx: Context<TransferRedeemedToUser>,
        bump: u8,
        amount: u64
    ) -> ProgramResult {

        instructions::transfer_redeemed_to_user::handler(
            ctx,
            bump,
            amount
        )
    }


}


/**
 * Error definitions
 */
#[error]
pub enum ErrorCode {
    #[msg("Redeemables to be paid out are somehow zero!")]
    LowBondRedeemableAmount,
    #[msg("Token to be paid into the bond should not be zero")]
    LowBondTokAmount,
    #[msg("Asking for too much SOL when redeeming!")]
    RedeemCapacity,
    #[msg("Not enough credits!")]
    MinPurchaseAmount,
    #[msg("Provided times are not an interval (end-time before start-time!)")]
    TimeFrameIsNotAnInterval,
    #[msg("Provided starting time is not in the future. You should make it in such a way that it is slightly in the future, s.t. you have the ability to pay in some amounts.")]
    TimeFrameIsInThePast,
    #[msg("Bond is already locked, you cannot pay in more into this bond!")]
    TimeFrameCannotPurchaseAdditionalBondAmount,
    #[msg("Bond has not gone past timeframe yet")]
    TimeFrameNotPassed,
    #[msg("There was an issue computing the market rate. MarketRateOverflow")]
    MarketRateOverflow,
    #[msg("There was an issue computing the market rate. MarketRateUnderflow")]
    MarketRateUnderflow,
    #[msg("Paying out more than was initially paid in")]
    PayoutError,
    #[msg("Redeemable-calculation doesnt add up")]
    Calculation,
    #[msg("Returning no Tokens!")]
    ReturningNoCurrency,
    #[msg("Custom Math Error 1!")]
    CustomMathError1,
    #[msg("Custom Math Error 2!")]
    CustomMathError2,
    #[msg("Custom Math Error 3!")]
    CustomMathError3,
    #[msg("Custom Math Error 4!")]
    CustomMathError4,
    #[msg("Custom Math Error 5!")]
    CustomMathError5,
    #[msg("Custom Math Error 6!")]
    CustomMathError6,
    #[msg("Custom Math Error 7!")]
    CustomMathError7,
    #[msg("Custom Math Error 8!")]
    CustomMathError8,
    #[msg("Custom Math Error 9!")]
    CustomMathError9,
    #[msg("Custom Math Error 10!")]
    CustomMathError10,
    #[msg("Custom Math Error 11!")]
    CustomMathError11,
    #[msg("Custom Math Error 12!")]
    CustomMathError12,
    #[msg("Custom Math Error 13!")]
    CustomMathError13,
    #[msg("Custom Math Error 14!")]
    CustomMathError14,
    #[msg("Custom Math Error 15!")]
    CustomMathError15,
    #[msg("Custom Math Error 16!")]
    CustomMathError16,
    #[msg("Custom Math Error 17!")]
    CustomMathError17,
    #[msg("Custom Math Error 18!")]
    CustomMathError18,
    #[msg("Custom Math Error 19!")]
    CustomMathError19,
    #[msg("Custom Math Error 20!")]
    CustomMathError20,
    #[msg("Custom Math Error 21!")]
    CustomMathError21,
    #[msg("Custom Math Error 22!")]
    CustomMathError22,
    #[msg("Total Token Supply seems empty!")]
    EmptyTotalTokenSupply,
    #[msg("Total Currency Supply seems empty!")]
    EmptyTotalCurrencySupply,
}
