use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid input token amount sent")]
    InvalidInputTokenAmountSent,

    #[msg("Invalid output token amount received")]
    InvalidOutputTokenAmountReceived,

    #[msg("Unexpected writable user account")]
    UnexpectedWritableUserAccount,

    #[msg("Unexpected update to user token account")]
    UnexpectedUserTokenAccountUpdate,
}
