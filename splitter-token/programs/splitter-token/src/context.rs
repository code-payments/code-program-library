use crate::state::*;
use crate::utils::*;

use {
    anchor_lang::prelude::*,
    anchor_spl::{
        token::{TokenAccount, Mint, Token},
    },

    crate::{
        error::ErrorCode,
        utils::{MAXIMUM_MERKLE_DEPTH, MAX_HISTORY},
    },
};

/// Creates a new token account to be used as a treasury pool by the splitter
/// token program. The pool will be initialized with an empty merkle tree. The
/// merkle tree keeps track of transfers made out of the treasury pool. Later,
/// proofs can be made, using the merkle tree state, that the treasury did
/// actually fullfil a payment intent.
#[derive(Accounts)]
#[instruction(
    name: String,       // The name of the treasury pool
    levels: u8,         // Depth of the merkle tree
)]
pub struct InitializePool<'info> {
    #[account(
        init,
        seeds=[
            PREFIX_POOL.as_bytes(),
            mint.to_account_info().key.as_ref(),
            authority.key.as_ref(),
            name.as_bytes(),
        ],

        payer = payer,
        space = Pool::LEN +
                Pool::get_history_size(MAX_HISTORY) +
                MerkleTree::get_proof_size(levels) * 2,
        bump
    )]
    pub pool: Box<Account<'info, Pool>>,

    #[account(
        init,
        payer = payer,

        token::mint = mint,
        token::authority = vault,

        seeds=[
            PREFIX_POOL_VAULT.as_bytes(),
            pool.to_account_info().key.as_ref(),
        ],
        bump,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    pub mint: Account<'info, Mint>,
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(
    pool_bump: u8,
)]
pub struct SaveRecentRoot<'info> {
    #[account(
        mut,
        has_one = authority @ ErrorCode::InvalidAuthority,
        seeds=[
            PREFIX_POOL.as_bytes(),
            pool.mint.as_ref(),
            pool.authority.as_ref(),
            pool.name.as_ref(),
        ],
        bump = pool_bump,
    )]
    pub pool: Box<Account<'info, Pool>>,

    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
}

/// Transfer tokens from the treasury pool to a destination and store the
/// receipt of that action into the merkle tree. 
/// 
/// Note: This instruction requires a commitment PDA for returning the transfer
/// amount at a later time. The commitment PDA is calculated from the payment
/// intent, destination, and amount. This value cannot be forged because it is
/// re-created on-chain and would fail if the on-chain address doesn't match
/// what is provided.
#[derive(Accounts)]
#[instruction(
    pool_bump: u8,
    amount: u64,                // amount to deposit
    transcript: [u8; 32],       // a 32-byte hash of the private payment intent data
    recent_root: [u8; 32]       // a recent root
)]
pub struct TransferWithCommitment<'info> {
    #[account(
        mut,
        has_one = authority @ ErrorCode::InvalidAuthority,
        seeds=[
            PREFIX_POOL.as_bytes(),
            pool.mint.as_ref(),
            pool.authority.as_ref(),
            pool.name.as_ref(),
        ],
        bump = pool_bump,
    )]
    pub pool: Box<Account<'info, Pool>>,

    #[account(
        mut,
        constraint = vault.amount > 0 @ ErrorCode::InsufficientVaultBalance,
        constraint = vault.key() == pool.vault @ ErrorCode::InvalidVaultAccount,
        
        token::mint = pool.mint,
        token::authority = vault,

        seeds=[
            PREFIX_POOL_VAULT.as_bytes(),
            pool.to_account_info().key.as_ref(),
        ],
        bump = pool.vault_bump,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = pool.mint,
    )]
    pub destination: Account<'info, TokenAccount>,

    /// CHECK: Checks that a given commitment PDA matches the transfer details.
    /// If everything is successful, this commitment is added as a leaf node to
    /// the program merkle tree.
    /// 
    /// Note: this value is hashed with itself internally to discern between
    /// leaf and intermediate nodes; to prevent trivial second pre-image attacks.
    /// https://flawed.net.nz/2018/02/21/attacking-merkle-trees-with-a-second-preimage-attack).
    #[account(
        seeds=[
            PREFIX_COMMITMENT.as_bytes(),
            pool.to_account_info().key.as_ref(),
            recent_root.as_ref(),
            transcript.as_ref(),

            // Here we're checking that the provided PDA matches what we would
            // get when making the transfer on chain.
            destination.to_account_info().key.as_ref(),
            amount.to_le_bytes().as_ref(),
        ],
        bump
    )]
    pub commitment: UncheckedAccount<'info>,
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

/// Initialize an account that will be used to estabilish a merkle proof that a
/// commitment was part of a recent root value. 
/// 
/// Note: We require this setup instead of sending the entire proof as arguments
/// because solana has a small transaction size limit that prevents us from
/// making such proofs in one shot. This setup is strictly to allow for deep
/// merkle trees.
#[derive(Accounts)]
#[instruction(
    pool_bump: u8,
    merkle_root: [u8; 32], // A recent root that was generated by the pool
    commitment: Pubkey     // The PDA we're going to prove is part of the recent root
)]
pub struct InitializeProof<'info> {
    #[account(
        // Make sure that this proof is for a recent root.
        constraint = pool.history_list.contains(&merkle_root) @ ErrorCode::InvalidRecentRoot,

        // While we don't need the authority for this instruction, this prevents
        // trivial attacks where someone could submit invalid proofs over and over...
        has_one = authority @ ErrorCode::InvalidAuthority,

        seeds=[
            PREFIX_POOL.as_bytes(),
            pool.mint.as_ref(),
            pool.authority.as_ref(),
            pool.name.as_ref(),
        ],
        bump = pool_bump,
    )]
    pub pool: Box<Account<'info, Pool>>,

    /// The location of our merkle proof state.
    #[account(
        init,
        seeds=[
            PREFIX_PROOF.as_bytes(),
            pool.to_account_info().key.as_ref(),
            merkle_root.as_ref(),
            commitment.as_ref(),
        ],

        payer = payer,
        space = Proof::LEN + 
                MerkleTree::get_proof_size(pool.merkle_tree.levels),
        bump
    )]
    pub proof: Box<Account<'info, Proof>>,
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

/// This instruction is used to upload chunks of a merkle proof to the proof
/// state account. 
/// 
/// Note: instructions can land out of order, so an expected_size value is
/// required. This should match the last data size (on-chain). For example, if
/// the state is currently 32 hashes but would be 64 after this instruction
/// succeeds, then the expected size is 32.
#[derive(Accounts)]
#[instruction(
    pool_bump: u8,
    proof_bump: u8,
    existing_size: u8,
    data_size: u8, // Needed for easy un-marshalling of the data vec
    data: Vec<[u8; 32]>,
)]
pub struct UploadProof<'info> {
    #[account(
        has_one = authority @ ErrorCode::InvalidAuthority,
        seeds=[
            PREFIX_POOL.as_bytes(),
            pool.mint.as_ref(),
            pool.authority.as_ref(),
            pool.name.as_ref(),
        ],
        bump = pool_bump,
    )]
    pub pool: Box<Account<'info, Pool>>,

    #[account(
        mut,
        has_one = pool,

        constraint = proof.size == existing_size @ ErrorCode::InvalidProofSize,
        constraint = data.len() == (data_size as usize) @ ErrorCode::InvalidProofSize,

        seeds=[
            PREFIX_PROOF.as_bytes(),
            proof.pool.as_ref(),
            proof.merkle_root.as_ref(),
            proof.commitment.as_ref(),
        ],
        bump = proof_bump,
    )]
    pub proof: Box<Account<'info, Proof>>,
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
}

/// This instruction asks the program to verify a merkle proof against it's
/// state. If successful, the state is updated to verified and allows us to open
/// a token account for that commitment.
#[derive(Accounts)]
#[instruction(
    pool_bump: u8,
    proof_bump: u8
)]
pub struct VerifyProof<'info> {
    #[account(
        has_one = authority @ ErrorCode::InvalidAuthority,
        seeds=[
            PREFIX_POOL.as_bytes(),
            pool.mint.as_ref(),
            pool.authority.as_ref(),
            pool.name.as_ref(),
        ],
        bump = pool_bump,
    )]
    pub pool: Box<Account<'info, Pool>>,

    #[account(
        mut,
        has_one = pool,

        constraint = proof.verified == false @ ErrorCode::ProofAlreadyVerified,
        constraint = proof.size == pool.merkle_tree.levels @ ErrorCode::InvalidProofSize,

        seeds=[
            PREFIX_PROOF.as_bytes(),
            proof.pool.as_ref(),
            proof.merkle_root.as_ref(),
            proof.commitment.as_ref(),
        ],
        bump = proof_bump,
    )]
    pub proof: Box<Account<'info, Proof>>,
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
}

/// This instruction can be used to close a proof once we're done with it in
/// order to release its rent.
/// 
/// This should be used after any associated token accounts are closed.
#[derive(Accounts)]
#[instruction(
    pool_bump: u8,
    proof_bump: u8
)]
pub struct CloseProof<'info> {
    #[account(
        has_one = authority @ ErrorCode::InvalidAuthority,
        seeds=[
            PREFIX_POOL.as_bytes(),
            pool.mint.as_ref(),
            pool.authority.as_ref(),
            pool.name.as_ref(),
        ],
        bump = pool_bump,
    )]
    pub pool: Box<Account<'info, Pool>>,

    #[account(
        mut,
        close = authority,
        has_one = pool,

        seeds=[
            PREFIX_PROOF.as_bytes(),
            proof.pool.as_ref(),
            proof.merkle_root.as_ref(),
            proof.commitment.as_ref(),
        ],
        bump = proof_bump,
    )]
    pub proof: Box<Account<'info, Proof>>,
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

/// This instruction allows us to open a token account for a commitment, whether
/// it is for a direct transfer or a batch. Both use the same PDA path for
/// simplicity. For example, if a commitment happens to be the last one inside
/// its batch, then that commitment is used for the PDA of the batch token
/// account.
/// 
/// This instruction requires a verified proof of the commitment.
#[derive(Accounts)]
#[instruction(
    pool_bump: u8,
    proof_bump: u8,
)]
pub struct OpenTokenAccount<'info> {
    #[account(
        has_one = authority @ ErrorCode::InvalidAuthority,
        seeds=[
            PREFIX_POOL.as_bytes(),
            pool.mint.as_ref(),
            pool.authority.as_ref(),
            pool.name.as_ref(),
        ],
        bump = pool_bump,
    )]
    pub pool: Box<Account<'info, Pool>>,

    #[account(
        has_one = pool,
        constraint = proof.verified == true @ ErrorCode::ProofNotVerified,

        seeds=[
            PREFIX_PROOF.as_bytes(),
            proof.pool.as_ref(),
            proof.merkle_root.as_ref(),
            proof.commitment.as_ref(),
        ],
        bump = proof_bump,
    )]
    pub proof: Box<Account<'info, Proof>>,

    #[account(
        init,
        payer = payer,

        token::mint = mint,
        token::authority = commitment_vault,

        seeds=[
            PREFIX_COMMITMENT_VAULT.as_bytes(),
            pool.to_account_info().key.as_ref(),
            proof.commitment.as_ref(),
        ],
        bump,
    )]
    pub commitment_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        // Make sure we're opening the right kind of mint for the pool.
        constraint = mint.key() == pool.mint
    )]
    pub mint: Account<'info, Mint>,

    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

/// This instruction closes a token account for a commitment or block, but first
/// moves its balance to the pool treasury account.
/// 
/// This instruction requires a verified proof of the commitment.
#[derive(Accounts)]
#[instruction(
    pool_bump: u8,
    proof_bump: u8,
    vault_bump: u8,
)]
pub struct CloseTokenAccount<'info> {
    #[account(
        mut,
        has_one = authority @ ErrorCode::InvalidAuthority,

        seeds=[
            PREFIX_POOL.as_bytes(),
            pool.mint.as_ref(),
            pool.authority.as_ref(),
            pool.name.as_ref(),
        ],
        bump = pool_bump,
    )]
    pub pool: Box<Account<'info, Pool>>,

    #[account(
        has_one = pool,
        constraint = proof.verified == true @ ErrorCode::ProofNotVerified,

        seeds=[
            PREFIX_PROOF.as_bytes(),
            proof.pool.as_ref(),
            proof.merkle_root.as_ref(),
            proof.commitment.as_ref(),
        ],
        bump = proof_bump,
    )]
    pub proof: Box<Account<'info, Proof>>,

    #[account(
        mut,

        token::mint = pool.mint,
        token::authority = commitment_vault,

        seeds=[
            PREFIX_COMMITMENT_VAULT.as_bytes(),
            pool.to_account_info().key.as_ref(),
            proof.commitment.as_ref(),
        ],
        bump = vault_bump,
    )]
    pub commitment_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = pool_vault.key() == pool.vault @ ErrorCode::InvalidVaultAccount,

        token::mint = pool.mint,
        token::authority = pool_vault,

        seeds=[
            PREFIX_POOL_VAULT.as_bytes(),
            pool.to_account_info().key.as_ref(),
        ],
        bump = pool.vault_bump,
    )]
    pub pool_vault: Box<Account<'info, TokenAccount>>,

    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
