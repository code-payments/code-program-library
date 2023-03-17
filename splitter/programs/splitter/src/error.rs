use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {

    #[msg("Invalid pool state for this instruction")]
    InvalidPoolState,

    #[msg("Invalid commitment state for this instruction")]
    InvalidCommitmentState,

    #[msg("Invalid recent root value")]
    InvalidRecentRoot, 

    #[msg("Invalid token account")]
    InvalidVaultAccount,

    #[msg("Insufficient vault funds")]
    InsufficientVaultBalance,

    #[msg("Invalid authority")]
    InvalidAuthority,

    #[msg("Invalid vault owner")]
    InvalidVaultOwner,

    #[msg("Merkle tree full")]
    MerkleTreeFull,

    #[msg("Invalid merkle tree depth")]
    InvalidMerkleTreeDepth,

    #[msg("Proof already verified")]
    ProofAlreadyVerified,

    #[msg("Proof not verified")]
    ProofNotVerified,

    #[msg("Invalid proof size")]
    InvalidProofSize,

    #[msg("Invalid proof")]
    InvalidProof,
}