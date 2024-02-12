use {
    crate::{
        state::*,
        utils::*,
    },
    anchor_lang::prelude::*,
    anchor_spl::token::TokenAccount,
};

#[derive(Accounts)]
#[instruction()]
pub struct PreSwap<'info> {
    #[account(
        init,
        seeds=[
            PREFIX_PRE_SWAP_STATE.as_bytes(),
            source.to_account_info().key.as_ref(),
            destination.to_account_info().key.as_ref(),
            nonce.key.as_ref(),
        ],

        payer = payer,
        space = PreSwapState::get_total_space(source.to_account_info(), destination.to_account_info()),
        bump
    )]
    pub pre_swap_state: Box<Account<'info, PreSwapState>>,

    pub user: Signer<'info>,
    pub source: Box<Account<'info, TokenAccount>>,
    pub destination: Box<Account<'info, TokenAccount>>,

    /// CHECK: used as a random value
    pub nonce: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(
    state_bump: u8,
    max_to_send: u64,
    min_to_receive: u64,
)]
pub struct PostSwap<'info> {
    #[account(
        mut,
        close = payer,
        has_one = source,
        has_one = destination,

        seeds=[
            PREFIX_PRE_SWAP_STATE.as_bytes(),
            pre_swap_state.source.as_ref(),
            pre_swap_state.destination.as_ref(),
            pre_swap_state.nonce.as_ref(),
        ],
        bump = state_bump,
    )]
    pub pre_swap_state: Box<Account<'info, PreSwapState>>,

    pub source: Box<Account<'info, TokenAccount>>,
    pub destination: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub payer: Signer<'info>,
}
