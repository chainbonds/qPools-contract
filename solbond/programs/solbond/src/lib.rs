//! Use docstrings as specified here: https://doc.rust-lang.org/rustdoc/how-to-write-documentation.html
mod instructions;
mod utils;
mod state;
    
use anchor_lang::prelude::*;
use anchor_spl::token::{Token};
use instructions::*;
declare_id!("CNYbaeQEV1s3TwDXLYyEWCBxp1rC9u1To48WWKDBQzph");


#[program]
pub mod solbond {
    use super::*;


    pub fn solana_test_healthcheck(program_id: &Pubkey, accounts: &[AccountInfo], instruction_data: &[u8]) -> ProgramResult {
        msg!(
            "process_instruction: {}: {} accounts, data={:?}",
            program_id,
            accounts.len(),
            instruction_data
        );
        Ok(())
    }

    /**
     * This model creates a portfolio where the base currency is USDC i.e the user only pays in USDC.
     * The steps 1-3 are permissioned, meaning that the user has to sign client side. The point is to 
     * make these instructions fairly small such that they can all be bundled together in one transaction. 
     * Create a Portfolio workflow:
     * 1) create_portfolio(ctx,bump,weights,num_pos,amount_total):
     *      ctx: context of the portfolio
     *      bump: bump for the portfolio_pda
     *      weights: the weights in the portfolio (check if sum is normalized)
     *      num_positions: number of positions this portfolio will have
     *      amount: total amount of USDC in the portfolio
     * 
     * 2) for position_i in range(num_positions):
     *          approve_position_weight_{PROTOCOL_NAME}(ctx, args)
     * 
     * 3) transfer_to_portfolio():
     *      transfers the agreed upon amount to a ATA owned by portfolio_pda
     * 
    */

    /**
     * Permissioned instruction which approves the creation of a new Portfolio
     * User approves the creation of a new PDA {portfolio_pda},
     * seeded by the user's Pubkey
     * The PDA will sign the creation of new positions
    */
    pub fn create_portfolio(
        ctx: Context<SavePortfolio>,
        _bump: u8,
        _sum_of_weights: u64,
        _num_positions: u32,
        _num_currencies: u32,

    ) -> ProgramResult {
        instructions::approve::approve_portfolio_weights::handler(
            ctx,
            _bump,
            _sum_of_weights,
            _num_positions,
            _num_currencies,

        )
    }

    /**
     * Permissioned instruction which approves the weight and amount of a specific Position
     * Creates a PDA {position_pda} seeded by the {portfolio_pda} and the index of the position
     * The user approves the weight, and amount of the specific position, 
     * index, weight, amount and mint_address of the pool are saved in the PDA
    */

    pub fn approve_position_weight_saber(
        ctx: Context<ApprovePositionWeightSaber>,
        _bump_portfolio: u8,
        _bump_position: u8,
        _weight: u64,
        _max_initial_token_a_amount: u64,
        _max_initial_token_b_amount: u64,
        _min_mint_amount: u64,
        _index: u32,
    ) -> ProgramResult {
        
        instructions::approve::saber::approve_position_weight::handler(
            ctx,
            _bump_portfolio,
            _bump_position,
            _weight,
            _max_initial_token_a_amount,
            _max_initial_token_b_amount,
            _min_mint_amount,
            _index,
        )

    }

    pub fn approve_position_weight_marinade(
        ctx: Context<ApprovePositionWeightMarinade>,
        _bump_portfolio: u8,
        _bump_position: u8,
        _bump_marinade: u8,
        _weight: u64,
        _initial_sol_amount: u64,
        _index: u32
    ) -> ProgramResult {
        instructions::approve::marinade::approve_position_weight_marinade::handler(
            ctx,
            _bump_portfolio,
            _bump_position,
            _bump_marinade,
            _weight,
            _initial_sol_amount,
            _index
        )
    }

    pub fn approve_position_weight_solend(
        ctx: Context<ApprovePositionWeightSolend>,
        _bump_portfolio: u8,
        _bump_position: u8,
        _bump_currency: u8,
        _weight: u64,
        _input_amount: u64,
        _index: u32,
    ) -> ProgramResult {
        instructions::approve::solend::approve_position_solend::handler(
            ctx,
            _bump_portfolio,
            _bump_position,
            _bump_currency,
            _weight,
            _input_amount,
            _index
        )
    }
    /**
     * Permissioned. Transfer the agreed to amount to the portfolio owned token account
    */

    pub fn transfer_to_portfolio(
        ctx: Context<TransferToPortfolio>,
        _bump_portfolio: u8,
        _bump_user_currency: u8,
    ) -> ProgramResult {
            instructions::transfer_to_portfolio::handler(
                ctx,
                _bump_portfolio,
                _bump_user_currency,
            )
    }


    /** 
     * Withdraw a Portfolio workflow:
     * 1) approve_withdraw_to_user(ctx,amount_total):
     *      ctx: context of the portfolio
     *      amount: total amount of USDC in the portfolio
     * 
     * 2) for position_i in range(num_positions):
     *          approve_withdraw_amount_{PROTOCOL_NAME}(ctx, args)
     * 3) for position_i in range(num_positions):
     *          withdraw
     * 
     * 3) transfer_redeemed_to_user():
     *      transfers the funds back to the user
     * 
    */


    pub fn approve_withdraw_to_user(
        ctx: Context<ApproveWithdrawPortfolio>,
        _bump_portfolio: u8,
    ) -> ProgramResult {
        instructions::approve_portfolio_withdraw::handler(
            ctx,
            _bump_portfolio,
        )
    }

    pub fn approve_withdraw_amount_saber(
        ctx: Context<ApproveWithdrawAmountSaber>,
        _bump_portfolio: u8,
        _bump_position: u8,
        _pool_token_amount: u64,
        _minimum_token_amount: u64,
        _index: u32,
    ) -> ProgramResult {
        instructions::approve::saber::approve_withdraw_amount::handler(
            ctx,
            _bump_portfolio,
            _bump_position,
            _pool_token_amount,
            _minimum_token_amount,
            _index,
        )
    }

    pub fn approve_withdraw_marinade(
        ctx: Context<ApproveWithdrawMarinade>,
        _bump_portfolio: u8,
        _bump_position: u8,
        _index: u32,
    ) -> ProgramResult {
        instructions::approve::marinade::approve_withdraw_marinade::handler(
            ctx,
            _bump_portfolio,
            _bump_position,
            _index,
        )
    }

    pub fn approve_withdraw_solend(
        ctx: Context<ApproveWithdrawAmountSolend>,
        _bump_portfolio: u8,
        _bump_position: u8,
        _withdraw_amount: u64,
        _index: u32,
    ) -> ProgramResult {
        instructions::approve::solend::approve_withdraw_solend::handler(
            ctx, 
            _bump_portfolio,
            _bump_position,
            _withdraw_amount,
            _index
        )
    }

    pub fn approve_initial_currency_amount(
        ctx: Context<ApproveInitialCurrencyAmount>,
        _bump_user_currency: u8,
        _input_amount_currency: u64,
    ) -> ProgramResult {
        instructions::approve::approve_initial_currency_amount::handler(
            ctx,
            _bump_user_currency,
            _input_amount_currency,
        )
    }

    pub fn approve_currency_withdraw_amount(
        ctx: Context<ApproveCurrencyWithdrawAmount>,
        _bump_portfolio: u8,
        _bump_user_currency: u8,
        _withdraw_amount_currency: u64,
    ) -> ProgramResult {
        instructions::approve::approve_currency_withdraw_amount::handler(
            ctx,
            _bump_portfolio,
            _bump_user_currency,
            _withdraw_amount_currency,
        )
    }



    pub fn create_position_marinade(
        ctx: Context<MarinadePositionInstruction>,
        _bump_portfolio: u8,
        _bump_position: u8,
        _bump_marinade: u8,
        _index: u32,
    ) -> ProgramResult {
        instructions::cpi::marinade::create_position_marinade::handler(
            ctx, 
            _bump_portfolio, 
            _bump_position,
            _bump_marinade,
            _index
        )
    }

    pub fn create_position_saber(
        ctx: Context<SaberLiquidityInstruction>,
        _bump_position: u8,
        _bump_portfolio: u8,
        _index:u32,
    ) -> ProgramResult {
        instructions::cpi::saber::create_position::handler(
            ctx, 
            _bump_position,
            _bump_portfolio,
            _index, 
        )
    }

    pub fn create_position_solend(
        ctx: Context<SolendPositionInstruction>,
        _bump_position: u8,
        _bump_portfolio: u8,
        _index:u32,
    ) -> ProgramResult {
        instructions::cpi::solend::create_position_solend::handler(
            ctx, 
            _bump_position,
            _bump_portfolio,
            _index, 
        )
    }

    pub fn redeem_position_saber(
        ctx: Context<RedeemSaberPosition>,
        _bump_portfolio: u8,
        _bump_position: u8,
        //_bump_pool: u8,
        _index: u32,
    ) -> ProgramResult {

        instructions::cpi::saber::redeem_position_two_sided::handler(
            ctx, 
            _bump_portfolio,
        _bump_position, 
        //_bump_pool, 
        _index
    )

    }


    pub fn redeem_position_one_saber(
        ctx: Context<RedeemOneSaberPosition>,
        _bump_portfolio: u8,
        _bump_position: u8,
        //_bump_pool: u8,
        _index: u32,
    ) -> ProgramResult {
        instructions::cpi::saber::redeem_position_one_sided::handler(
            ctx, 
            _bump_portfolio,
        _bump_position,
        //_bump_pool, 
        _index
    )
    }

    pub fn redeem_position_solend(
        ctx: Context<RedeemPositionSolend>, 
        _bump_position: u8,
        _bump_portfolio: u8,
        _index: u32,
    ) -> ProgramResult {
        instructions::cpi::solend::redeem_position_solend::handler(
            ctx, 
            _bump_position,
            _bump_portfolio,
            _index
        )
    }
    
    

    
    pub fn transfer_redeemed_to_user(
        ctx: Context<TransferRedeemedToUser>,
        _bump_portfolio: u8,
        _bump_user_currency: u8,
    ) -> ProgramResult {

        instructions::transfer_redeemed_to_user::handler(
            ctx,
            _bump_portfolio,
            _bump_user_currency,
        )
    }

}
//#[cfg(test)]
//mod tests;

/**
 * Error definitions
 */
#[error]
pub enum ErrorCode {
    #[msg("Position can't be set for redeem before portfolio completion")]
    PortfolioNotFullyCreated,
    #[msg("Index of position surpasses approved number of positions")]
    IndexHigherThanNumPos,
    #[msg("Marinade needs more than 1 SOL")]
    MarinadeNeedsMoreThanOneSol,
    #[msg("Redeem has not been approved yet!")]
    RedeemNotApproved,
    #[msg("Position has already been redeemed!")]
    PositionAlreadyRedeemed,
    #[msg("Redeem already approved")]
    RedeemAlreadyApproved,
    #[msg("Position can't be redeemed before fulfillment")]
    PositionNotFulfilledYet,
    #[msg("All positions have already been redeemed! You can transfer the funds back")]
    AllPositionsRedeemed,
    #[msg("Positions have to redeemed before the funds get transfered back")]
    NotReadyForTransferBack,
    #[msg("Provided LP mints don't match!")]
    ProvidedMintNotMatching,
    #[msg("Provided Portfolios don't match!")]
    ProvidedPortfolioNotMatching,
    #[msg("Position already fully created!")]
    PositionFullyCreatedError,
    #[msg("Position already fulfilled!")]
    PositionAlreadyFulfilledError,
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
