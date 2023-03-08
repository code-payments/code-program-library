use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum TimeLockState {
    Unknown = 0,
    Unlocked,
    WaitingForTimeout,
    Locked,
    Closed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum DataVersion {
    Unknown = 0,
    Legacy,        // Legacy version of the timelock program (unused by this program)
    Closed,        // Used to prevent re-initialization attacks within a single transaction
    Version1,      // Current data version
    Version2,      // Future version, adds support for more than 255 days (if needed)
}

#[account]
pub struct TimeLockAccount {
    // https://solanacookbook.com/guides/data-migration.html#how-can-you-migrate-a-program-s-data-accounts
    pub data_version: DataVersion,

    pub time_authority: Pubkey,
    pub close_authority: Pubkey,
    pub mint: Pubkey,

    pub vault: Pubkey,
    pub vault_bump: u8,
    pub vault_state: TimeLockState,
    pub vault_owner: Pubkey,

    pub unlock_at: Option<i64>,
    pub num_days_locked: u8, // Max 255 days on Version1
}

impl TimeLockAccount {
    pub const LEN: usize = 
        8  +  // discriminator
        1  +  // data_version

        32 +  // time_authority
        32 +  // close_authority
        32 +  // mint

        32 +  // vault
        1  +  // vault_bump
        1  +  // vault_state
        32 +  // vault_owner

        9  +  // unlock_at
        1  ;  // num_days_locked
}
