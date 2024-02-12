import * as anchor from "@project-serum/anchor";
import { SwapValidator } from "../../target/types/swap_validator";
import { PublicKey, Keypair } from "@solana/web3.js";

export interface TestUser {
  keypair: Keypair;
  token1: PublicKey;
  token2: PublicKey;
  token3: PublicKey;
}

export interface TestEnv {
  provider: anchor.AnchorProvider;
  program: anchor.Program<SwapValidator>;

  mint1: PublicKey;
  mint2: PublicKey;

  payer: Keypair;

  user: TestUser;
  amm: TestUser,
}

export function logEnvironment(env: TestEnv) {
  console.log(`\n`);
  console.log(`\t* mint1: ${env.mint1.toBase58()}`);
  console.log(`\t* mint2: ${env.mint2.toBase58()}`);
  console.log(`\t* payer: ${env.payer.publicKey.toBase58()}`);
  console.log(`\t* user: ${env.user.keypair.publicKey.toBase58()}`);
  console.log(`\t* user (token1): ${env.user.token1.toBase58()}`);
  console.log(`\t* user (token2): ${env.user.token2.toBase58()}`);
  console.log(`\t* user (token3): ${env.user.token3.toBase58()}`);
  console.log(`\t* amm: ${env.amm.keypair.publicKey.toBase58()}`);
  console.log(`\t* amm (token1): ${env.amm.token1.toBase58()}`);
  console.log(`\t* amm (token2): ${env.amm.token2.toBase58()}`);
  console.log(`\t* amm (token3): ${env.amm.token3.toBase58()}`);

  console.log(`\n`);
}
