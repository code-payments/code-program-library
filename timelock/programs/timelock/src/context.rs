use crate::state::*;
use crate::utils::*;

use {
    anchor_lang::prelude::*,
    anchor_spl::{
        token::{TokenAccount, Mint, Token},
    },

    crate::{
        error::ErrorCode,
    },
};


// Initialize a timelock account and token vault with a co-signer who has
// authority over the withdraw timeout period on the vault.
#[derive(Accounts)]
#[instruction(num_days_locked: u8)]
pub struct Initialize<'info> {

    #[account(
        init,
        seeds=[
            // Ensure we have one timelock account per: 
            // mint, time_authority, nonce, owner and num_days_locked combination
            // The padding and PDA version give us some flexibility for future migrations
            TIMELOCK_STATE.as_bytes(),
            mint.to_account_info().key.as_ref(),
            time_authority.key.as_ref(),
            vault_owner.key.as_ref(),
            num_days_locked.to_le_bytes().as_ref(),
        ],
        payer = payer,
        space = TimeLockAccount::LEN,
        bump
    )]
    pub timelock: Box<Account<'info, TimeLockAccount>>,

    #[account(
        init,
        payer = payer,

        constraint = timelock.data_version != DataVersion::Closed @ ErrorCode::InvalidTimeLockState,

        token::mint = mint,
        token::authority = vault,

        seeds=[
            TIMELOCK_VAULT.as_bytes(),
            timelock.to_account_info().key.as_ref(),
            &[DataVersion::Version1 as u8],
        ],
        bump,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    pub vault_owner: SystemAccount<'info>,
    pub mint: Account<'info, Mint>,

    pub time_authority: Signer<'info>,

    #[account(mut)]
    // This account is used to pay for the timelock rent and therefore gets
    // close_authority as well (where the rent would be returned if the timelock
    // gets closed).
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// Activate the timelock. Any funds in the vault can no longer be transfered
// without revoking the timelock first or transfering with authority
#[derive(Accounts)]
#[instruction(timelock_bump: u8)]
pub struct ActivateLock<'info> {
    #[account(
        mut,
        constraint = timelock.vault_state == TimeLockState::Unlocked @ ErrorCode::InvalidTimeLockState,

        has_one = vault_owner @ ErrorCode::InvalidVaultOwner,

        seeds=[
            TIMELOCK_STATE.as_bytes(),
            timelock.mint.as_ref(),
            timelock.time_authority.as_ref(),
            timelock.vault_owner.as_ref(),
            timelock.num_days_locked.to_le_bytes().as_ref(),
        ],
        bump = timelock_bump,
    )]
    pub timelock: Box<Account<'info, TimeLockAccount>>,
    pub vault_owner: Signer<'info>, 

    #[account(mut)]
    pub payer: Signer<'info>,
}

// Deactivate the timelock (unlock). If successful, any funds in the vault can
// be claimed by the vault owner.
#[derive(Accounts)]
#[instruction(timelock_bump: u8)]
pub struct DeactivateLock<'info> {
    #[account(
        mut,
        constraint = timelock.num_days_locked > 0 @ ErrorCode::InvalidTimeLockDuration,
        constraint = timelock.unlock_at.is_some() @ ErrorCode::InvalidTimeLockState,
        constraint = timelock.vault_state == TimeLockState::WaitingForTimeout @ ErrorCode::InvalidTimeLockState,

        has_one = vault_owner @ ErrorCode::InvalidVaultOwner,

        seeds=[
            TIMELOCK_STATE.as_bytes(),
            timelock.mint.as_ref(),
            timelock.time_authority.as_ref(),
            timelock.vault_owner.as_ref(),
            timelock.num_days_locked.to_le_bytes().as_ref(),
        ],
        bump = timelock_bump,
    )]
    pub timelock: Box<Account<'info, TimeLockAccount>>,
    pub vault_owner: Signer<'info>, 

    #[account(mut)]
    pub payer: Signer<'info>,
}

// Request to unlock the timelock token account and agree to wait the timeout
// period (no co-signer authority needed for this action)
#[derive(Accounts)]
#[instruction(timelock_bump: u8)]
pub struct RevokeLockWithTimeout<'info> {
    #[account(
        mut,
        constraint = timelock.vault_state == TimeLockState::Locked @ ErrorCode::InvalidTimeLockState,

        has_one = vault @ ErrorCode::InvalidVaultAccount,
        has_one = vault_owner @ ErrorCode::InvalidVaultOwner,

        seeds=[
            TIMELOCK_STATE.as_bytes(),
            timelock.mint.as_ref(),
            timelock.time_authority.as_ref(),
            timelock.vault_owner.as_ref(),
            timelock.num_days_locked.to_le_bytes().as_ref(),
        ],
        bump = timelock_bump,
    )]
    pub timelock: Box<Account<'info, TimeLockAccount>>,

    #[account(
        constraint = vault.key() == timelock.vault @ ErrorCode::InvalidVaultAccount,
        
        token::mint = timelock.mint,
        token::authority = vault,

        seeds=[
            TIMELOCK_VAULT.as_bytes(),
            timelock.to_account_info().key.as_ref(),
            &[timelock.data_version as u8],
        ],
        bump = timelock.vault_bump,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    pub vault_owner: Signer<'info>, 

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// Request to unlock the timelock token account and get the co-sign authority to
// cancel the timeout period (the co-signer authority is needed for this action)
#[derive(Accounts)]
#[instruction(timelock_bump: u8)]
pub struct RevokeLockWithAuthority<'info> {
    #[account(
        mut,
        constraint = timelock.vault_state == TimeLockState::Locked @ ErrorCode::InvalidTimeLockState,

        has_one = vault @ ErrorCode::InvalidVaultAccount,
        has_one = time_authority @ ErrorCode::InvalidTimeAuthority,

        seeds=[
            TIMELOCK_STATE.as_bytes(),
            timelock.mint.as_ref(),
            timelock.time_authority.as_ref(),
            timelock.vault_owner.as_ref(),
            timelock.num_days_locked.to_le_bytes().as_ref(),
        ],
        bump = timelock_bump,
    )]
    pub timelock: Box<Account<'info, TimeLockAccount>>,

    #[account(
        constraint = vault.key() == timelock.vault @ ErrorCode::InvalidVaultAccount,
        
        token::mint = timelock.mint,
        token::authority = vault,

        seeds=[
            TIMELOCK_VAULT.as_bytes(),
            timelock.to_account_info().key.as_ref(),
            &[timelock.data_version as u8],
        ],
        bump = timelock.vault_bump,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,

    pub time_authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// Cancel the waiting period for a given lock (only the time_authority can do
// this). If successful, the lock waiting period will be reduced to 0. This will
// allow the vault owner to deactivate the lock early.
#[derive(Accounts)]
#[instruction(timelock_bump: u8)]
pub struct CancelLockTimeout<'info> {
    #[account(
        mut,
        constraint = timelock.num_days_locked > 0 @ ErrorCode::InvalidTimeLockDuration,
        constraint = timelock.unlock_at.is_some() @ ErrorCode::InvalidTimeLockState,
        constraint = timelock.vault_state == TimeLockState::WaitingForTimeout @ ErrorCode::InvalidTimeLockState,

        has_one = time_authority @ ErrorCode::InvalidTimeAuthority,

        seeds=[
            TIMELOCK_STATE.as_bytes(),
            timelock.mint.as_ref(),
            timelock.time_authority.as_ref(),
            timelock.vault_owner.as_ref(),
            timelock.num_days_locked.to_le_bytes().as_ref(),
        ],
        bump = timelock_bump,
    )]
    pub timelock: Box<Account<'info, TimeLockAccount>>,
    pub time_authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// Transfer from the timelock vault account to another account (potentially a
// normal token account). This action requires a co-signature, specifically from
// the time_authority.
#[derive(Accounts)]
#[instruction(timelock_bump: u8, amount: u64)]
pub struct TransferWithAuthority<'info> {
    #[account(
        constraint = (timelock.vault_state == TimeLockState::Locked || timelock.vault_state == TimeLockState::WaitingForTimeout) @ ErrorCode::InvalidTimeLockState,

        has_one = time_authority @ ErrorCode::InvalidTimeAuthority,
        has_one = vault @ ErrorCode::InvalidVaultAccount,
        has_one = vault_owner @ ErrorCode::InvalidVaultOwner,

        seeds=[
            TIMELOCK_STATE.as_bytes(),
            timelock.mint.as_ref(),
            timelock.time_authority.as_ref(),
            timelock.vault_owner.as_ref(),
            timelock.num_days_locked.to_le_bytes().as_ref(),
        ],
        bump = timelock_bump,
    )]
    pub timelock: Box<Account<'info, TimeLockAccount>>,

    #[account(
        mut,
        constraint = vault.amount > 0 @ ErrorCode::InsufficientVaultBalance,
        constraint = vault.key() == timelock.vault @ ErrorCode::InvalidVaultAccount,
        
        token::mint = timelock.mint,
        token::authority = vault,

        seeds=[
            TIMELOCK_VAULT.as_bytes(),
            timelock.to_account_info().key.as_ref(),
            &[timelock.data_version as u8],
        ],
        bump = timelock.vault_bump,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    pub vault_owner: Signer<'info>, 
    pub time_authority: Signer<'info>,

    #[account(
        mut,
        token::mint = timelock.mint,
    )]
    pub destination: Account<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// Burn ALL dust from the timelock vault account up to a max_amount. This action
// requires a co-signature, specifically from the time_authority.
#[derive(Accounts)]
#[instruction(timelock_bump: u8, max_amount: u64)]
pub struct BurnDustWithAuthority<'info> {
    #[account(
        constraint = (timelock.vault_state == TimeLockState::Locked || timelock.vault_state == TimeLockState::WaitingForTimeout) @ ErrorCode::InvalidTimeLockState,

        has_one = time_authority @ ErrorCode::InvalidTimeAuthority,
        has_one = vault @ ErrorCode::InvalidVaultAccount,
        has_one = vault_owner @ ErrorCode::InvalidVaultOwner,

        seeds=[
            TIMELOCK_STATE.as_bytes(),
            timelock.mint.as_ref(),
            timelock.time_authority.as_ref(),
            timelock.vault_owner.as_ref(),
            timelock.num_days_locked.to_le_bytes().as_ref(),
        ],
        bump = timelock_bump,
    )]
    pub timelock: Box<Account<'info, TimeLockAccount>>,

    #[account(
        mut,

        // Leaving this constraint out for now, this allows us to chain this
        // instruction with others and not have to worry about zero balances
        //constraint = vault.amount > 0 @ ErrorCode::InsufficientVaultBalance,

        constraint = vault.key() == timelock.vault @ ErrorCode::InvalidVaultAccount,
        
        token::mint = timelock.mint,
        token::authority = vault,

        seeds=[
            TIMELOCK_VAULT.as_bytes(),
            timelock.to_account_info().key.as_ref(),
            &[timelock.data_version as u8],
        ],
        bump = timelock.vault_bump,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    pub vault_owner: Signer<'info>, 
    pub time_authority: Signer<'info>,

    #[account(
        mut,

        address = timelock.mint @ ErrorCode::InvalidTokenMint,
    )]
    pub mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// Withdraw tokens from the vault (Note: the timelock vault must be unlocked)
#[derive(Accounts)]
#[instruction(timelock_bump: u8)]
pub struct Withdraw<'info> {
    #[account(
        constraint = timelock.vault_state == TimeLockState::Unlocked @ ErrorCode::InvalidTimeLockState,

        has_one = vault @ ErrorCode::InvalidVaultAccount,
        has_one = vault_owner @ ErrorCode::InvalidVaultOwner,

        seeds=[
            TIMELOCK_STATE.as_bytes(),
            timelock.mint.as_ref(),
            timelock.time_authority.as_ref(),
            timelock.vault_owner.as_ref(),
            timelock.num_days_locked.to_le_bytes().as_ref(),
        ],
        bump = timelock_bump,
    )]
    pub timelock: Box<Account<'info, TimeLockAccount>>,

    #[account(
        mut,

        // Leaving this constraint out for now, this allows us to chain this
        // instruction with others and not have to worry about zero balances
        //constraint = vault.amount > 0 @ ErrorCode::InsufficientVaultBalance,
        constraint = vault.key() == timelock.vault @ ErrorCode::InvalidVaultAccount,
        
        token::mint = timelock.mint,
        token::authority = vault,

        seeds=[
            TIMELOCK_VAULT.as_bytes(),
            timelock.to_account_info().key.as_ref(),
            &[timelock.data_version as u8],
        ],
        bump = timelock.vault_bump,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    pub vault_owner: Signer<'info>, 

    #[account(
        mut,
        token::mint = timelock.mint,
    )]
    pub destination: Account<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// Close the timelock. Only the close_authority can do this and the
// prerequisite is that the vault is empty. The Initialize instruction sets the
// payer to the close authority.
#[derive(Accounts)]
#[instruction(timelock_bump: u8)]
pub struct CloseAccounts<'info> {
    #[account(
        mut,
        close = close_authority, // rent goes to the close authority
        has_one = close_authority @ ErrorCode::InvalidCloseAuthority,

        seeds=[
            TIMELOCK_STATE.as_bytes(),
            timelock.mint.as_ref(),
            timelock.time_authority.as_ref(),
            timelock.vault_owner.as_ref(),
            timelock.num_days_locked.to_le_bytes().as_ref(),
        ],
        bump = timelock_bump,
    )]
    pub timelock: Box<Account<'info, TimeLockAccount>>,

    #[account(
        mut,

        // Anchor is not able to do this, so we close this account manually
        //close = close_authority 

        // Token balance must be zero
        constraint = vault.amount == 0 @ ErrorCode::NonZeroTokenBalance,
        constraint = vault.key() == timelock.vault @ ErrorCode::InvalidVaultAccount,
        
        token::mint = timelock.mint,
        token::authority = vault,

        seeds=[
            TIMELOCK_VAULT.as_bytes(),
            timelock.to_account_info().key.as_ref(),
            &[timelock.data_version as u8],
        ],
        bump = timelock.vault_bump,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,

    pub close_authority: Signer<'info>, 

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
