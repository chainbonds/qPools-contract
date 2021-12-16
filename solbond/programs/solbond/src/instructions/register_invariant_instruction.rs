use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::{BondPoolAccount, InvariantPoolAccount};
use amm::cpi::accounts::Swap;

use amm::{self, Tickmap, State, Pool, Tick, Position, PositionList};


#[derive(Accounts)]
#[instruction(
_bump_register_position: u8,
_curr_idx: u32,
_max_idx: u32,
weight: u32,

)]
pub struct RegisterInvariantInstruction<'info> {



    #[account(
    init,
    payer = initializer,
    space = 8 + InvariantPoolAccount::LEN,
    seeds = [initializer.key.as_ref(), format!("invariantPoolAccount{}",_curr_idx).as_bytes()],
    bump = _bump_register_position
    )]
    pub invariant_pool_account: Account<'info, InvariantPoolAccount>,

    //pub pool_address: AccountInfo<'info>,
    pub pool: Loader<'info, Pool>,
    //pub state: AccountInfo<'info>,
    pub state: Loader<'info, State>,
    pub tickmap: Loader<'info, Tickmap>,
    //pub tickmap: AccountInfo<'info>,

    pub currency_token_mint: Account<'info, Mint>,
    pub token_x_mint: Account<'info, Mint>,


    //#[account(
    //mut,
    //constraint = &reserve_currency_token.mint == currency_token_mint.to_account_info().key
    //)]
    #[account(mut)]
    pub reserve_currency_token: Account<'info, TokenAccount>,

    //#[account(
    //mut,
    //constraint = &reserve_x.mint == token_x_mint.to_account_info().key
    //)]
    #[account(mut)]
    pub reserve_x: Box<Account<'info, TokenAccount>>,

    //#[account(
    //mut,
    //constraint = &account_currency_reserve.mint == currency_token_mint.to_account_info().key
    //)]
    #[account(mut)]
    pub account_currency_reserve: Box<Account<'info, TokenAccount>>,

    //#[account(
    //mut,
    //constraint = &account_x_reserve.mint == currency_token_mint.to_account_info().key
    //)]
    #[account(mut)]
    pub account_x_reserve: Box<Account<'info, TokenAccount>>,

    #[account(signer, mut)]
    pub initializer: AccountInfo<'info>,






    //pub position_in_pool: AccountInfo<'info>,
    //pub position: Loader<'info, Position>,
    //pub position_list: Loader<'info, PositionList>,

    // TODO: add constraints and seeds and stuff
    //pub upper_tick: Loader<'info, Tick>,
    // pub lower_tick: Loader<'info, Tick>,

    // The standards accounts
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,

}



pub fn handler(
    ctx: Context<RegisterInvariantInstruction>,
    _bump_register_position: u8,
    _curr_idx: u32,
    _max_idx: u32,
    weight: u32,
) -> ProgramResult {

    msg!("REGISTER SWAP");
    let invariant_pool_account = &mut ctx.accounts.invariant_pool_account;
    invariant_pool_account.idx = _curr_idx;
    invariant_pool_account.max_idx = _max_idx;


    invariant_pool_account.pool = ctx.accounts.pool.key(); //: Pubkey,  // Pre-generated
    invariant_pool_account.state = ctx.accounts.state.key(); //: Pubkey,  // Pre-generated
    invariant_pool_account.pool_weight = weight; //: u32,  // Fed-in as argument (by us, with Miller's endpoint)
    invariant_pool_account.tickmap = ctx.accounts.tickmap.key(); //: Pubkey,

    // token accounts
    invariant_pool_account.token_currency_mint = ctx.accounts.currency_token_mint.key();
    invariant_pool_account.token_x_mint = ctx.accounts.token_x_mint.key();
    invariant_pool_account.pool_token_currency_address = ctx.accounts.reserve_currency_token.key();
    invariant_pool_account.pool_token_x_address = ctx.accounts.reserve_x.key();
    invariant_pool_account.qpool_token_currency_address = ctx.accounts.account_currency_reserve.key();
    invariant_pool_account.qpool_token_x_address = ctx.accounts.account_x_reserve.key();

    // invariant_pool_account.position_in_pool = ctx.accounts.position.key();
    // invariant_pool_account.position_list_in_pool = ctx.accounts.position_list.key();
    // invariant_pool_account.upper_tick = ctx.accounts.upper_tick.key();
    // invariant_pool_account.lower_tick = ctx.accounts.lower_tick.key();

    invariant_pool_account.initializer = ctx.accounts.initializer.key();
    invariant_pool_account._bump_pool_list = _bump_register_position;


    Ok(())

}