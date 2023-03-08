/* seeds of the PDAs, can be anything you want */
/* remember to change them on the JS too (constants.ts file) */

pub static PREFIX_POOL: &str             = "pool_state";
pub static PREFIX_POOL_VAULT: &str       = "pool_vault";
pub static PREFIX_COMMITMENT: &str       = "commitment_state";
pub static PREFIX_COMMITMENT_VAULT: &str = "commitment_vault";
pub static PREFIX_PROOF: &str            = "proof";
pub static PREFIX_MERKLE_TREE: &str      = "merkletree";


/// Max len of a string buffer in bytes
pub const NAME_DEFAULT_SIZE: usize = 32;

/// Maximum number of recent merkle roots to store in the pool state
pub const MAX_HISTORY: u8 = 32;

/// Max levels on the merkle tree (affects both transaction size and rent). A
/// tree with depth 64 can store 2^64 transactions, or 18,446,744,073,709,551,616
pub const MAXIMUM_MERKLE_DEPTH: usize = 64;
