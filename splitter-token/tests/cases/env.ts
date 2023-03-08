import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { TimelockToken } from "../../target/types/timelock_token";
import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import { logEnvironment, TestEnv } from "../utils/test-env";
import { api_wait } from "../utils/wait";
import { getPoolPda, getPoolVaultPda } from "../utils/pda";
import { PREFIX_MERKLE_TREE } from "../utils/config";
import { MerkleTree } from "../utils/merkle-tree";

export async function newTestEnv(provider: anchor.AnchorProvider): Promise<TestEnv> {
  const program = anchor.workspace.TimelockToken as Program<TimelockToken>;
  const mintAuthority = Keypair.generate();

  const payer = Keypair.generate();
  const alice = Keypair.generate();
  const bob = Keypair.generate();

  // Give code some SOL to pay for things
  await api_wait();
  await provider.connection.confirmTransaction(
    await provider.connection.requestAirdrop(payer.publicKey, 1000000000)
    , "confirmed"
  );

  // Create the MINT
  await api_wait();
  const mint = await Token.createMint(provider.connection, payer,
    mintAuthority.publicKey, null, 0, TOKEN_PROGRAM_ID);

  // Create Alice's token account
  await api_wait();
  const aliceTokenAccount = await mint.createAccount(alice.publicKey);

  // Create Bob's token account
  await api_wait();
  const bobTokenAccount = await mint.createAccount(bob.publicKey);

  // Send 10000 tokens to alice.
  await api_wait();
  await mint.mintTo(aliceTokenAccount, mintAuthority.publicKey, [mintAuthority], 10000);

  // Here we're creating a public key that has no private key (off the curve).
  // This public address points to the timelock state.
  const poolName = "alice-test-pool";
  const [pool, bump] = await getPoolPda(mint.publicKey, payer.publicKey, poolName);
  const [vault] = await getPoolVaultPda(pool);

  // Seeds for the empty value in the merkle tree
  const emptySeeds = Buffer.concat([
    Buffer.from(PREFIX_MERKLE_TREE),
    pool.toBytes(),
  ]);

  const depth = 10;
  const merkleTree = new MerkleTree(emptySeeds, depth);

  const env = {
    provider,
    program,

    mint: mint.publicKey,
    mintTo: async (dest: PublicKey, amount: number): Promise<void> => mint.mintTo(dest, mintAuthority.publicKey, [mintAuthority], amount),

    payer: payer,

    alice: {
      keypair: alice,
      token: aliceTokenAccount
    },
    bob: {
      keypair: bob,
      token: bobTokenAccount
    },

    pool: {
      name: poolName,
      address: pool,
      vault: vault,
      bump: bump,
      merkleTree,
      currentBatch: 0,
    }
  } as TestEnv;

  logEnvironment(env);

  return env;
}
