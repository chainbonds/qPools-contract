use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use crate::{state::{PositionAccountMarinade, PortfolioAccount}};
use crate::utils::seeds;
use crate::ErrorCode;

use anchor_lang::{
    prelude::*,
    InstructionData,
    solana_program::instruction::{Instruction},
};
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
    _bump_marinade: u8,
    _bump_msol_ata: u8,
    _index: u32,
)]
pub struct MarinadePositionInstruction<'info> {

    #[account(
        mut,
        //seeds = [
        //    owner.key().as_ref(),
        //    &_index.to_le_bytes(),
        //    seeds::USER_POSITION_STRING
        //],
        //bump = _bump_position,
    )]
    pub position_pda: Box<Account<'info, PositionAccountMarinade>>,

    #[account(
        mut, 
        //seeds = [owner.key().as_ref(), seeds::PORTFOLIO_SEED], bump = _bump_portfolio
    )]
    pub portfolio_pda: Box<Account<'info, PortfolioAccount>>,

    #[account(mut)]
    pub puller: Signer<'info>,

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

    #[account(
        init_if_needed,
        payer = puller,
        token::mint = msol_mint,
        token::authority = portfolio_pda,
        seeds = [portfolio_pda.owner.key().as_ref(),msol_mint.key().as_ref(),seeds::TOKEN_ACCOUNT_SEED],
        bump = _bump_msol_ata
    )]
    pub mint_to: Account<'info,TokenAccount>, // associatedMSolTokenAccountAddress, need to create this

    pub msol_mint_authority: AccountInfo<'info>, // await marinadeState.mSolMintAuthority(),

    #[account(
        mut,
        seeds = [portfolio_pda.owner.key().as_ref(), seeds::USER_MARINADE_SEED], bump = _bump_marinade
    )]
    pub owner_sol_pda: AccountInfo<'info>, // check this the right one
    //#[account(mut)]

    #[account(address = marinade_finance::ID)]
    pub marinade_program: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}


pub fn handler(
    ctx: Context<MarinadePositionInstruction>,
    _bump_marinade: u8,
    _bump_msol_ata: u8,
    _index: u32,
) -> ProgramResult {

    if ctx.accounts.portfolio_pda.key() != ctx.accounts.position_pda.portfolio_pda {
        return Err(ErrorCode::ProvidedPortfolioNotMatching.into());
    }
    let dep_amt: u64 = ctx.accounts.position_pda.initial_sol_amount;
    msg!("depamt {}", dep_amt);
    msg!("owner of pda {}", ctx.accounts.position_pda.to_account_info().owner);
    msg!("owner of pdaportfo {}", ctx.accounts.portfolio_pda.to_account_info().owner);
    msg!("owner of pdaportfo {}", ctx.accounts.liq_pool_sol_leg_pda.to_account_info().owner);

    let data = marinade_finance::instruction::Deposit{ lamports:dep_amt };
    let cpi_accounts = MarinadeDeposit {
        state: ctx.accounts.state.to_account_info(),
        msol_mint: ctx.accounts.msol_mint.to_account_info(),
        liq_pool_sol_leg_pda: ctx.accounts.liq_pool_sol_leg_pda.to_account_info(),
        liq_pool_msol_leg: ctx.accounts.liq_pool_msol_leg.to_account_info(),
        liq_pool_msol_leg_authority: ctx.accounts.liq_pool_msol_leg_authority.to_account_info(),
        reserve_pda: ctx.accounts.reserve_pda.to_account_info(),
        transfer_from: ctx.accounts.owner_sol_pda.to_account_info(),
        mint_to: ctx.accounts.mint_to.to_account_info(),
        msol_mint_authority: ctx.accounts.msol_mint_authority.to_account_info(),
        system_program:ctx.accounts.system_program.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };
    let cpictx = CpiContext::new(ctx.accounts.marinade_program.to_account_info(),
    cpi_accounts,
    );
 
    let ix = Instruction {
        program_id: *cpictx.program.key,
        accounts: cpictx.to_account_metas(None).into_iter()
                                                    .map(|mut meta| {
                                                        if meta.pubkey == ctx.accounts.owner_sol_pda.to_account_info().key() {
                                                            meta.is_signer = true;
                                                        }
                                                        meta
                                                    }).collect(),
        data: data.data()

    };

    anchor_lang::solana_program::program::invoke_signed(
        &ix, 
        &cpictx.to_account_infos(),
        &[
            [
                ctx.accounts.portfolio_pda.owner.key().as_ref(),
                seeds::USER_MARINADE_SEED,
                &[_bump_marinade]
            ].as_ref()
        ]

    )?;

    let approved_position_details = &mut ctx.accounts.position_pda;
    approved_position_details.is_fulfilled = true;
    
    let clock = Clock::get().unwrap();
    approved_position_details.timestamp = clock.unix_timestamp;
    let portfolio = &mut ctx.accounts.portfolio_pda;
    portfolio.num_created += 1;
    if portfolio.num_created >= portfolio.num_positions {
        portfolio.fully_created = true;
        portfolio.fulfilled_timestamp = clock.unix_timestamp;
    }

  
    Ok(())
}