use crate::utils::{ NAME_DEFAULT_SIZE, MAXIMUM_MERKLE_DEPTH };
use crate::{ error::ErrorCode, };
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum DataVersion {
    Unknown = 0,
    Version1,
}

impl Default for DataVersion {
    fn default() -> Self {
        DataVersion::Unknown
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub struct MerkleTree {
    pub levels: u8,      // Maximum levels is 64
    pub next_index: u64, // This is sized to index up to 2^(MAXIMUM_MERKLE_DEPTH) leaf nodes
    pub root: [u8; 32],

    pub filled_subtrees: Vec<[u8; 32]>,
    pub zero_values: Vec<[u8; 32]>,
}


// todo: move this into its own crate... 
impl MerkleTree {
    pub const LEN: usize = 
        1  +  // levels
        8  +  // next_index
        32 +  // root hash

        4 + // filled_subtrees length
        4;  // zero_values length
        

    pub fn get_proof_size(levels: u8) -> usize {
        return 32 * levels as usize;
    }

    pub fn new(seeds: &[&[u8]], levels: u8) -> Self {
        let zeros = MerkleTree::calc_zeros(levels, seeds);

        MerkleTree {
            levels: levels,
            next_index: 0,
            root: zeros.last().unwrap().clone(),
            filled_subtrees: zeros.clone(),
            zero_values: zeros,
        }
    }

    /// Returns a vector of zero_value hashes for a merkle tree given levels and
    /// seeds.
    fn calc_zeros(levels: u8, seeds: &[&[u8]]) -> Vec<[u8; 32]> {
        let mut zeros = vec![];
        let mut current = solana_program::hash::hashv(seeds).to_bytes();

        for _ in 0..levels {
            current = solana_program::hash::hashv(&[
                current.as_ref(), current.as_ref()
            ]).to_bytes();

            zeros.push(current);
        }

        zeros
    }

    /// Returns the hash of left and right sorted and concatinated. We sort so that
    /// proofs are deterministic later.
    pub fn hash_left_right(left: [u8; 32], right: [u8; 32]) -> [u8; 32] {
        let combined;
        if left <= right {
            combined = [left.as_ref(), right.as_ref()]
        } else {
            combined = [right.as_ref(), left.as_ref()]
        }
        solana_program::hash::hashv(&combined).to_bytes()
    }

    /// Adds a leaf node to the merkle tree at the next_index position.
    pub fn add_leaf(&mut self, leaf: [u8; 32]) -> Result<()> {
        if self.next_index >= u64::pow(2, self.levels.into()) {
            return Err(ErrorCode::MerkleTreeFull.into());
        }
        
        let mut current_index : u64 = self.next_index;
        let mut current_hash: [u8; 32] = solana_program::hash::hash(leaf.clone().as_ref()).to_bytes();
        let mut left;
        let mut right;

        for i in 0..self.levels.into() {
            let i:usize = i;

            if current_index % 2 == 0 {
                left = current_hash;
                right = self.zero_values[i].clone();
                self.filled_subtrees[i] = current_hash.clone();
            } else {
                left = self.filled_subtrees[i].clone();
                right = current_hash;
            }

            current_hash = MerkleTree::hash_left_right(left, right);
            current_index = current_index / 2;
        }

        self.root = current_hash;

        self.next_index += 1;
        
        Ok(())
    }

    /// Returns true if a `leaf` can be proved to be a part of a Merkle tree
    /// defined by `root`. For this, a `proof` must be provided, containing
    /// sibling hashes on the branch from the leaf to the root of the tree. Each
    /// pair of leaves and each pair of pre-images are assumed to be sorted.
    pub fn verify(proof: &Vec<[u8; 32]>, root: [u8; 32], leaf: [u8; 32]) -> bool {
        let mut computed_hash = solana_program::hash::hash(leaf.clone().as_ref()).to_bytes();
        for proof_element in proof.into_iter() {
            computed_hash = MerkleTree::hash_left_right(computed_hash, proof_element.clone());
        }
        // Check if the computed hash (root) is equal to the provided root
        computed_hash == root
    }

}


#[account]
pub struct Pool {
    // https://solanacookbook.com/guides/data-migration.html#how-can-you-migrate-a-program-s-data-accounts
    pub data_version: DataVersion, 

    pub authority: Pubkey,
    pub mint: Pubkey,

    pub vault: Pubkey,
    pub vault_bump: u8,

    pub name: String,                // Name of the pool, allows for multiple pools per authority

    pub history_list: Vec<[u8; 32]>, // A circular buffer of recent roots
    pub current_index: u8,           // Index of the most recent root in history_list

    pub merkle_tree: MerkleTree,
}

impl Pool {
    pub const LEN: usize = 
        8  +  // discriminator
        1  +  // data_version

        32 +  // authority
        32 +  // mint

        32 +  // vault
        1  +  // vault_bump

        4 + // name length
        NAME_DEFAULT_SIZE + // name

        4  +  // history_list
        1  +  // current_index

        MerkleTree::LEN; // merkle_tree

    /// Get the size of the history_list buffer for the given count.
    pub fn get_history_size(num: u8) -> usize {
        return 32 * num as usize;
    }

    /// Get the latest root from the merkle tree.
    pub fn get_recent_root(&self) -> [u8; 32] {
        return self.history_list[
            self.current_index as usize
        ].clone();
    }

}


#[account]
pub struct Proof {
    // https://solanacookbook.com/guides/data-migration.html#how-can-you-migrate-a-program-s-data-accounts
    pub data_version: DataVersion, 

    pub pool: Pubkey,
    pub pool_bump: u8,

    pub merkle_root: [u8; 32],
    pub commitment: Pubkey,
    pub verified: bool,

    pub size: u8, // Count of hashes *currently* in the proof
    pub data: Vec<[u8; 32]>,
}

impl Proof {
    pub const LEN: usize = 
        8  +  // discriminator
        1  +  // data_version
        32 +  // pool
        1  +  // pool_bump
        32 +  // merkle_root
        32 +  // commitment
        1  +  // verified
        1  +  // size
        4;    // data
}
