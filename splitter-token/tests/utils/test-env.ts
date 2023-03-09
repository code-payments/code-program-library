import * as anchor from "@project-serum/anchor";
import { TimelockToken } from "../../target/types/timelock_token";
import { PublicKey, Keypair } from "@solana/web3.js";
import { MerkleTree } from "./merkle-tree";

export interface TestUser {
  keypair: Keypair;
  token: PublicKey;
}

export interface Pool {
    name: string;
    address: PublicKey,
    bump: number;
    vault: PublicKey,
    currentBatch: number;
    merkleTree: MerkleTree;
}

export interface TestEnv {
  provider: anchor.AnchorProvider;
  program: anchor.Program<TimelockToken>;
  mint: PublicKey;
  mintTo: (dest: PublicKey, amount: number) => Promise<void>;

  payer: Keypair;

  alice: TestUser;
  bob: TestUser;
  charlie: TestUser;

  pool: Pool;
}


export function logEnvironment(env: TestEnv) {
    console.log(`\n`);
    console.log(`\t* mint: ${env.mint.toBase58()}`);
    console.log(`\t* payer: ${env.payer.publicKey.toBase58()}`);
    console.log(`\t* alice: ${env.alice.keypair.publicKey.toBase58()}`);
    console.log(`\t* bob: ${env.bob.keypair.publicKey.toBase58()}`);
    console.log(`\t* charlie: ${env.charlie.keypair.publicKey.toBase58()}`);
    console.log(`\t* alice (token): ${env.alice.token.toBase58()}`);
    console.log(`\t* bob (token): ${env.bob.token.toBase58()}`);
    console.log(`\t* charlie (token): ${env.charlie.token.toBase58()}`);
    console.log(`\n`);
    console.log(`\n* pool: ${env.pool.address.toBase58()}`);
    console.log(`\t* pool vault: ${env.pool.vault.toBase58()}`);
    console.log(`\t* pool bump: ${env.pool.bump}`);
    console.log(`\n`);
    console.log(`Pool Merkle Tree`);
    console.log(env.pool.merkleTree.prettyPrint());
    console.log(`\n`);
}