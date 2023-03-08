use {
    crate::{
        error::ErrorCode,
    },
    anchor_lang::prelude::*,
    context::*,
    anchor_spl::token::{self, Transfer, CloseAccount, Burn},
};


pub mod context;
pub mod error;
pub mod state;
pub mod utils;

declare_id!("time2Z2SCnn3qYg3ULKVtdkh8YmZ5jFdKicnA1W2YnJ");

#[program]
pub mod timelock_token {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, num_days_locked:u8) -> Result<()> {
        if num_days_locked <= 0 {
            return Err(ErrorCode::InvalidTimeLockDuration.into());
        }

        ctx.accounts.timelock.data_version = state::DataVersion::Version1;

        ctx.accounts.timelock.time_authority = ctx.accounts.time_authority.key();
        ctx.accounts.timelock.close_authority = ctx.accounts.payer.key();
        ctx.accounts.timelock.mint = ctx.accounts.mint.key();

        ctx.accounts.timelock.vault = ctx.accounts.vault.key();
        ctx.accounts.timelock.vault_bump = *ctx.bumps.get("vault").unwrap();
        ctx.accounts.timelock.vault_state = state::TimeLockState::Locked;
        ctx.accounts.timelock.vault_owner = ctx.accounts.vault_owner.key();

        ctx.accounts.timelock.num_days_locked = num_days_locked;
        ctx.accounts.timelock.unlock_at = None;

        Ok(())
    }

    pub fn activate(ctx: Context<ActivateLock>, _timelock_bump : u8) -> Result<()> {
        if ctx.accounts.timelock.vault_state != state::TimeLockState::Unlocked {
            return Err(ErrorCode::InvalidTimeLockState.into());
        }

        ctx.accounts.timelock.vault_state = state::TimeLockState::Locked;
        ctx.accounts.timelock.unlock_at = None;

        Ok(())
    }

    pub fn deactivate(ctx: Context<DeactivateLock>, _timelock_bump : u8) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;

        if ctx.accounts.timelock.vault_state != state::TimeLockState::WaitingForTimeout {
            return Err(ErrorCode::InvalidTimeLockState.into());
        }

        if ctx.accounts.timelock.unlock_at.is_none() {
            return Err(ErrorCode::InvalidTimeLockState.into());
        }

        if ctx.accounts.timelock.unlock_at.unwrap() > now {
            msg!("Cannot deactivate lock just yet.");
            msg!("The current time is: {}", now);
            msg!("The earliest unlock at: {}", ctx.accounts.timelock.unlock_at.unwrap());
            return Err(ErrorCode::InsufficientTimeElapsed.into());
        }

        ctx.accounts.timelock.vault_state = state::TimeLockState::Unlocked;
        ctx.accounts.timelock.unlock_at = None;

        Ok(())
    }

    pub fn revoke_lock_with_timeout(ctx: Context<RevokeLockWithTimeout>, _timelock_bump : u8) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;

        if ctx.accounts.timelock.vault_state != state::TimeLockState::Locked {
            return Err(ErrorCode::InvalidTimeLockState.into());
        }

        let second_per_day = 86400; // 60sec * 60min * 24hrs = 86400
        let mut unlock_at = now + (ctx.accounts.timelock.num_days_locked as i64 * second_per_day); 
        if unlock_at % second_per_day > 0 {
            // Bump the unlock time to the start of the next UTC day if we haven't
            // landed on it. This drastically simplifies searching for newly unlocked
            // accounts.
            unlock_at = unlock_at + (second_per_day - (unlock_at % second_per_day))
        }
        msg!("The unlock time is set for: {}", unlock_at);

        ctx.accounts.timelock.unlock_at = Some(unlock_at);
        ctx.accounts.timelock.vault_state = state::TimeLockState::WaitingForTimeout;

        Ok(())
    }

    pub fn revoke_lock_with_authority(ctx: Context<RevokeLockWithAuthority>, _timelock_bump : u8) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;

        if ctx.accounts.timelock.vault_state != state::TimeLockState::Locked {
            return Err(ErrorCode::InvalidTimeLockState.into());
        }

        // Since the time_authority has signed, we can allow the lock to be
        // released immediately. 
        ctx.accounts.timelock.unlock_at = Some(now);
        ctx.accounts.timelock.vault_state = state::TimeLockState::WaitingForTimeout;

        // Note, we're not releasing the lock here deliberately to reduce the
        // possible code flows leading to unlocked state.

        Ok(())
    }

    pub fn cancel_lock_timeout(ctx: Context<CancelLockTimeout>, _timelock_bump : u8) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;

        if ctx.accounts.timelock.vault_state != state::TimeLockState::WaitingForTimeout {
            return Err(ErrorCode::InvalidTimeLockState.into());
        }

        // Since the time_authority has signed, we can allow the lock to be
        // released immediately. 
        ctx.accounts.timelock.unlock_at = Some(now);

        // Note, we're not releasing the lock here deliberately to reduce the
        // possible code flows leading to unlocked state.

        Ok(())
    }

    pub fn transfer_with_authority(ctx: Context<TransferWithAuthority>, _timelock_bump : u8, amount : u64) -> Result<()> {

        if ctx.accounts.timelock.vault_state != state::TimeLockState::Locked && ctx.accounts.timelock.vault_state != state::TimeLockState::WaitingForTimeout {
            return Err(ErrorCode::InvalidTimeLockState.into());
        } 

        let seeds = [
            utils::TIMELOCK_VAULT.as_bytes(),
            ctx.accounts.timelock.to_account_info().key.as_ref(),
            &[ctx.accounts.timelock.data_version as u8],
            &[ctx.accounts.timelock.vault_bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info().clone(),
            to: ctx.accounts.destination.to_account_info().clone(),
            authority: ctx.accounts.vault.to_account_info().clone(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info().clone();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        Ok(())
    }

    pub fn burn_dust_with_authority(ctx: Context<BurnDustWithAuthority>, _timelock_bump : u8, max_amount : u64) -> Result<()> {

        if ctx.accounts.timelock.vault_state != state::TimeLockState::Locked && ctx.accounts.timelock.vault_state != state::TimeLockState::WaitingForTimeout {
            return Err(ErrorCode::InvalidTimeLockState.into());
        } 

        if max_amount <= 0 {
            return Err(ErrorCode::InvalidDustBurn.into());
        }

        // Only allow dust transfers if the amount is less than the dust threshold.
        let amount = ctx.accounts.vault.amount % max_amount;
        if amount > max_amount {
            return Err(ErrorCode::InvalidDustBurn.into());
        }

        if amount == 0 {
            // No dust to burn.
            return Ok(());
        }

        let seeds = [
            utils::TIMELOCK_VAULT.as_bytes(),
            ctx.accounts.timelock.to_account_info().key.as_ref(),
            &[ctx.accounts.timelock.data_version as u8],
            &[ctx.accounts.timelock.vault_bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info().clone(),
            from: ctx.accounts.vault.to_account_info().clone(),
            authority: ctx.accounts.vault.to_account_info().clone(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info().clone();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::burn(cpi_ctx, amount)?;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, _timelock_bump : u8) -> Result<()> {

        if ctx.accounts.timelock.vault_state != state::TimeLockState::Unlocked {
            return Err(ErrorCode::InvalidTimeLockState.into());
        }

        let seeds = [
            utils::TIMELOCK_VAULT.as_bytes(),
            ctx.accounts.timelock.to_account_info().key.as_ref(),
            &[ctx.accounts.timelock.data_version as u8],
            &[ctx.accounts.timelock.vault_bump]
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info().clone(),
            to: ctx.accounts.destination.to_account_info().clone(),
            authority: ctx.accounts.vault.to_account_info().clone(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info().clone();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, ctx.accounts.vault.amount)?;

        Ok(())
    }

    pub fn close_accounts(ctx: Context<CloseAccounts>, _timelock_bump : u8) -> Result<()> {

        // The close trait is used in the CloseAccounts context so Anchor will
        // close the timelock account for us. We can't do the same for the vault
        // account though because anchor doesn't know how to sign the CPI
        // properly for that.

        // Manually close the vault account.
        let seeds = [
            utils::TIMELOCK_VAULT.as_bytes(),
            ctx.accounts.timelock.to_account_info().key.as_ref(),
            &[ctx.accounts.timelock.data_version as u8],
            &[ctx.accounts.timelock.vault_bump]
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = CloseAccount {
            account: ctx.accounts.vault.to_account_info().clone(),
            destination: ctx.accounts.close_authority.to_account_info().clone(),
            authority: ctx.accounts.vault.to_account_info().clone(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info().clone();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::close_account(cpi_ctx)?;

        // prevent re-init attacks
        ctx.accounts.timelock.vault_state = state::TimeLockState::Closed;
        ctx.accounts.timelock.data_version = state::DataVersion::Closed;

        Ok(())
    }
}

