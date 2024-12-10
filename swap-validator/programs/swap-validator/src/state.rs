use anchor_lang::prelude::*;

#[account]
pub struct PreSwapState {
    pub source: Pubkey,
    pub destination: Pubkey,
    pub nonce: Pubkey,

    pub source_amount: u64,
    pub destination_amount: u64,

    pub source_account_state: Vec<u8>,
    pub destination_account_state: Vec<u8>,
}

impl PreSwapState {
    pub const MIN_LEN: usize =
        8    + // discriminator

        32   + // source
        32   + // destination
        32   + // nonce

        8    + // source_amount
        8    + // destination_amount
        4    + // source_account_state length
        4;     // destination_account_state length

    pub fn get_total_space(source: AccountInfo, destination: AccountInfo) -> usize {
        return PreSwapState::MIN_LEN + source.try_borrow_data().unwrap().len() + destination.try_borrow_data().unwrap().len();
    }
}
