use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {

    #[msg("Invalid timelock state for this instruction")]
    InvalidTimeLockState,

    #[msg("Invalid timelock duration provided")]
    InvalidTimeLockDuration,

    #[msg("Invalid vault account")]
    InvalidVaultAccount,

    #[msg("The timelock period has not yet been reached")]
    InsufficientTimeElapsed,

    #[msg("Insufficient vault funds")]
    InsufficientVaultBalance,

    #[msg("Invalid time authority")]
    InvalidTimeAuthority,

    #[msg("Invalid vault owner")]
    InvalidVaultOwner,

    #[msg("Invalid close authority")]
    InvalidCloseAuthority,

    #[msg("Invalid token balance. Token balance must be zero.")]
    NonZeroTokenBalance,

    #[msg("Invalid dust burn.")]
    InvalidDustBurn,

    #[msg("Invalid token mint.")]
    InvalidTokenMint,
}