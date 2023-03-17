import * as anchor from "@project-serum/anchor";
import { Timelock } from "../../target/types/timelock";
import { PublicKey, Keypair } from "@solana/web3.js";

export interface TestUser {
  keypair: Keypair;
  token: PublicKey;
}

export interface TestEnv {
  provider: anchor.AnchorProvider;
  program: anchor.Program<Timelock>;

  mint: PublicKey;
  payer: Keypair;
  alice: TestUser;
  bob: TestUser;

  timelock?: PublicKey;
  timelockBump?: number;
  vault?: PublicKey;
}

export function logEnvironment(env: TestEnv) {
  console.log(`\n`);
  console.log(`\t* mint: ${env.mint.toBase58()}`);
  console.log(`\t* code: ${env.payer.publicKey.toBase58()}`);
  console.log(`\t* alice: ${env.alice.keypair.publicKey.toBase58()}`);
  console.log(`\t* bob: ${env.bob.keypair.publicKey.toBase58()}`);
  console.log(`\t* alice (token): ${env.alice.token.toBase58()}`);
  console.log(`\t* bob (token): ${env.bob.token.toBase58()}`);

  if (env.timelock) {
      console.log(`\t* timelock(alice): ${env.timelock.toBase58()}`);
      console.log(`\t* vault: ${env.vault.toBase58()}`);
  }

  console.log(`\n`);
}