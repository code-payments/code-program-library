import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { TimelockToken } from "../../target/types/timelock_token";
import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import { Keypair } from "@solana/web3.js";
import { logEnvironment, TestEnv } from "../utils/test-env";
import { api_wait } from "../utils/wait";
import { getTimelockStatePda, getTimelockVaultPda } from "../utils/pda";

export async function newTestEnv(provider: anchor.AnchorProvider) : Promise<TestEnv> {
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

  // Give alice some SOL to pay for things
  await api_wait();
  await provider.connection.confirmTransaction(
    await provider.connection.requestAirdrop(alice.publicKey, 1000000000)
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

  const env = {
    provider,
    program,
    payer,
    mint: mint.publicKey,

    alice: {
      keypair: alice,
      token: aliceTokenAccount
    },
    bob: {
      keypair: bob,
      token: bobTokenAccount
    },
  } as TestEnv;

  // Here we're creating a public key that has no private key (off the curve).
  // This public address points to the timelock state.
  const [timelock, bump] = await getTimelockStatePda(env, env.alice.keypair.publicKey);
  const [vault] = await getTimelockVaultPda(env, timelock);

  env.timelock = timelock;
  env.timelockBump = bump;
  env.vault = vault;

  logEnvironment(env);

  return env;
}
