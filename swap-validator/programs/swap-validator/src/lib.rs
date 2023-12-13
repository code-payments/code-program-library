use {
    crate::errors::ErrorCode,
    context::*,
    anchor_lang::prelude::*,
};

pub mod context;
pub mod errors;
pub mod state;
pub mod utils;

declare_id!("sWvA66HNNvgamibZe88v3NN5nQwE8tp3KitfViFjukA");

#[program]
pub mod swap_validator {
    use super::*;

    pub fn pre_swap(ctx: Context<PreSwap>) -> Result<()> {
        //
        // Part 1: Save source and destination token account state
        //

        ctx.accounts.pre_swap_state.source = ctx.accounts.source.key();
        ctx.accounts.pre_swap_state.destination = ctx.accounts.destination.key();
        ctx.accounts.pre_swap_state.nonce = ctx.accounts.nonce.key();

        ctx.accounts.pre_swap_state.source_amount = ctx.accounts.source.amount;
        ctx.accounts.pre_swap_state.destination_amount = ctx.accounts.destination.amount;

        let data = ctx.accounts.source.to_account_info().try_borrow_data().unwrap().to_owned();
        for byte in data.iter() {
            ctx.accounts.pre_swap_state.source_account_state.push(*byte);
        }

        let data = ctx.accounts.destination.to_account_info().try_borrow_data().unwrap().to_owned();
        for byte in data.iter() {
            ctx.accounts.pre_swap_state.destination_account_state.push(*byte);
        }

        //
        // Part 2: Ensure the user public key doesn't appear in any remaining accounts
        //

        let user_pubkey_bytes = ctx.accounts.user.key().to_bytes();
        let additional_writeable_user_accounts = ctx.remaining_accounts
            .iter()
            .filter(|account_info| {
                let data = account_info.try_borrow_data().unwrap().to_owned();
                let len: usize = data.len();
                for i in 0..len {
                    let data_slice = data.get(i..i+32);
                    if data_slice.is_none() {
                        return false
                    }
                    let compare_to = data_slice.unwrap();
                    for j in 0..32 {
                        if user_pubkey_bytes[j] != compare_to[j] {
                            break
                        }

                        if j == 31 {
                            return true
                        }
                    }
                }
                return false
            });

        if additional_writeable_user_accounts.count() > 0 {
            return Err(ErrorCode::UnexpectedWritableUserAccount.into());
        }

        Ok(())
    }

    pub fn post_swap(ctx: Context<PostSwap>, _state_bump: u8, max_to_send: u64, min_to_receive: u64) -> Result<()> {
        //
        // Part 1: Validate at most max_to_send tokens were sent out of the source token account
        //

        let source_amount_before = ctx.accounts.pre_swap_state.source_amount;
        let source_amount_after = ctx.accounts.source.amount;
        if source_amount_after > source_amount_before {
            return Err(ErrorCode::InvalidInputTokenAmountSent.into());
        }
        if source_amount_before - source_amount_after > max_to_send {
            return Err(ErrorCode::InvalidInputTokenAmountSent.into());
        }

        //
        // Part 2: Validate at least min_to_receive tokens were received in the destination token account
        //

        let destination_amount_before = ctx.accounts.pre_swap_state.destination_amount;
        let destination_amount_after = ctx.accounts.destination.amount;
        if destination_amount_after < destination_amount_before {
            return Err(ErrorCode::InvalidOutputTokenAmountReceived.into());
        }
        if destination_amount_after - destination_amount_before < min_to_receive {
            return Err(ErrorCode::InvalidOutputTokenAmountReceived.into());
        }

        //
        // Part 3: Ensure no other updates were made to the source token account
        //

        let updated_state = ctx.accounts.source.to_account_info().try_borrow_data().unwrap().to_owned();
        if ctx.accounts.pre_swap_state.source_account_state.len() != updated_state.len() {
            msg!("source state size difference detected");
            return Err(ErrorCode::UnexpectedUserTokenAccountUpdate.into());
        }

        for (i, byte) in updated_state.iter().enumerate() {
            // Ignore updates to the amount, which have already been validated
            if 64 <= i && i < 72 {
                continue
            }

            if ctx.accounts.pre_swap_state.source_account_state[i] != *byte {
                msg!("source state mismatch at byte {}", i);
                return Err(ErrorCode::UnexpectedUserTokenAccountUpdate.into());
            }
        }

        //
        // Part 4: Ensure no other updates were made to the destination token account
        //

        let updated_state = ctx.accounts.destination.to_account_info().try_borrow_data().unwrap().to_owned();
        if ctx.accounts.pre_swap_state.destination_account_state.len() != updated_state.len() {
            msg!("destination state size difference detected");
            return Err(ErrorCode::UnexpectedUserTokenAccountUpdate.into());
        }

        for (i, byte) in updated_state.iter().enumerate() {
            // Ignore updates to the amount, which have already been validated
            if 64 <= i && i < 72 {
                continue
            }

            if ctx.accounts.pre_swap_state.destination_account_state[i] != *byte {
                msg!("destination state mismatch at byte {}", i);
                return Err(ErrorCode::UnexpectedUserTokenAccountUpdate.into());
            }
        }

        Ok(())
    }
}
