use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use crate::{state::{PositionAccountMarinade, PortfolioAccount}};
use crate::utils::seeds;
use marinade_finance;
use marinade_onchain_helper::{
    cpi_context_accounts::{
        MarinadeDeposit, 
    },
    cpi_util
};
//use amm::{self, Tickmap, State, Pool, Tick, Position, PositionList};

// init_if_needed,
// payer = initializer,
// associated_token::mint = mint_b,
// associated_token::authority = portfolio_pda
// pub associated_token_program: Program<'info, AssociatedToken>
// use anchor_spl::associated_token::{self, AssociatedToken};



#[derive(Accounts)]
#[instruction(
    _bump_portfolio: u8,
    _bump_position: u8,
    _index: u32,
)]
pub struct MarinadePositionInstruction<'info> {

    #[account(
        mut,
        seeds = [
            owner.key().as_ref(),
            &_index.to_le_bytes(),
            seeds::USER_POSITION_STRING
        ],
        bump = _bump_position,
    )]
    pub position_pda: Box<Account<'info, PositionAccountMarinade>>,

    #[account(
        mut, 
        seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,

    #[account(mut)]
    pub state: AccountInfo<'info>, // marinadeState.marinadeStateAddress,

    #[account(mut)]
    pub msol_mint: AccountInfo<'info>, // marinadeState.mSolMintAddress,.

    #[account(mut)]
    pub liq_pool_sol_leg_pda: AccountInfo<'info>, // await marinadeState.solLeg(),

    #[account(mut)]
    pub liq_pool_msol_leg: Account<'info, TokenAccount>, // marinadeState.mSolLeg,

    pub liq_pool_msol_leg_authority: AccountInfo<'info>, // marinadeState.mSolLegAuthority(),

    #[account(mut)]
    pub reserve_pda: AccountInfo<'info>, // marinadeState.reserveAddress(),

    #[account(mut)]
    pub transfer_from: AccountInfo<'info>, // this is pda owned token account

    #[account(mut)]
    pub mint_to: Account<'info,TokenAccount>, // associatedMSolTokenAccountAddress, need to create this

    pub msol_mint_authority: AccountInfo<'info>, // await marinadeState.mSolMintAuthority(),


    //#[account(mut)]
    pub owner: AccountInfo<'info>,

    //#[account(address = marinade_finance::ID)]
    pub marinade_program: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> MarinadePositionInstruction<'info> {
    pub fn into_marinade_deposit_cpi_ctx(&self, _bump_portfolio:u8) -> CpiContext<'_,'_,'_, 'info, MarinadeDeposit<'info>> {
        let cpi_accounts = MarinadeDeposit {
            state: self.state.clone(),
            msol_mint: self.msol_mint.clone(),
            liq_pool_sol_leg_pda: self.liq_pool_sol_leg_pda.clone(),
            liq_pool_msol_leg: self.liq_pool_msol_leg.to_account_info(),
            liq_pool_msol_leg_authority: self.liq_pool_msol_leg_authority.clone(),
            reserve_pda: self.reserve_pda.clone(),
            transfer_from: self.transfer_from.clone(),
            mint_to: self.mint_to.to_account_info(),
            msol_mint_authority: self.msol_mint_authority.clone(),
            system_program:self.system_program.to_account_info(),
            token_program: self.token_program.to_account_info(),
        };
        
        CpiContext::new(
            self.marinade_program.clone(),
             cpi_accounts,
            )
    }
}

pub fn handler(
    ctx: Context<MarinadePositionInstruction>,
    _bump_portfolio: u8,
    _bump_position: u8,
    _index: u32,
) -> ProgramResult {
    //msg!("Creating a single saber position!");
    //msg!("getting portfolio details!");
    
    // if ctx.accounts.position_pda.is_fulfilled {
    //     return Err(ErrorCode::PositionAlreadyFulfilledError.into());
    // }
    // if ctx.accounts.position_pda.index > ctx.accounts.portfolio_pda.num_positions || ctx.accounts.portfolio_pda.fully_created {
    //     return Err(ErrorCode::PositionFullyCreatedError.into());
    // }
    // if ctx.accounts.portfolio_pda.key() != ctx.accounts.position_pda.portfolio_pda {
    //     return Err(ErrorCode::ProvidedPortfolioNotMatching.into());
    // }
    // if ctx.accounts.pool_mint.key() != ctx.accounts.position_pda.pool_address {
    //     return Err(ErrorCode::ProvidedMintNotMatching.into());
    // }

    let dep_amt: u64 = ctx.accounts.position_pda.initial_sol_amount;
    // let deposit_amt = MarinadeDepositAmount {
    //     lamports: dep_amt
    // };
    // let mut dep_in_bytes: Vec<u8> = Vec::new();
    // deposit_amt.serialize(&mut dep_in_bytes)?;
    // let marinade_program = ctx.accounts.marinade_program.clone();
    
    
    let cpi_ctx = ctx.accounts.into_marinade_deposit_cpi_ctx(_bump_portfolio);
    let data = marinade_finance::instruction::Deposit{ lamports:dep_amt };

    cpi_util::invoke_signed(cpi_ctx.with_signer(
        &[
                [
                    ctx.accounts.owner.key().as_ref(),
                    seeds::PORTFOLIO_SEED,
                    &[_bump_portfolio]
                ].as_ref()
            ]
    )  
    ,data)?;
    //marinade_onchain_helper::cpi_util::invoke_signed(
    //    CpiContext::new_with_signer(
    //        marinade_program,
    //        marinade_deposit_context,
    //        &[
    //            [
    //                ctx.accounts.owner.key().as_ref(),
    //                seeds::PORTFOLIO_SEED,
    //                &[_bump_portfolio]
    //            ].as_ref()
    //        ]
    //    ),
    //    &deposit_amt,
    //    
    //)?;



    /***
     * DEFENIETLY CHECK IF MARINADE PROGRAM IS THE RIGHT ONE
     */
  


    Ok(())
}