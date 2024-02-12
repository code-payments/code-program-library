import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SwapValidator } from "../../target/types/swap_validator";
import { createMint, createAccount, mintTo } from "@solana/spl-token";
import { Keypair } from "@solana/web3.js";
import { logEnvironment, TestEnv } from "../utils/test-env";
import { apiWait } from "../utils/wait";

export async function newTestEnv(provider: anchor.AnchorProvider) : Promise<TestEnv> {
  const program = anchor.workspace.SwapValidator as Program<SwapValidator>;

  const payer = Keypair.generate();
  const user = Keypair.generate();
  const amm = Keypair.generate();

  await apiWait();
  await provider.connection.confirmTransaction(
    await provider.connection.requestAirdrop(payer.publicKey, 1000000000)
    , "confirmed"
  );

  const mintAuthority1 = Keypair.generate();
  const mintAuthority2 = Keypair.generate();
  const mintAuthority3 = Keypair.generate();

  await apiWait();
  const mint1 = await createMint(provider.connection, payer, mintAuthority1.publicKey, null, 0);

  await apiWait();
  const mint2 = await createMint(provider.connection, payer, mintAuthority2.publicKey, null, 0);

  await apiWait();
  const mint3 = await createMint(provider.connection, payer, mintAuthority3.publicKey, null, 0);

  await apiWait();
  const userTokenAccount1 = await createAccount(provider.connection, payer, mint1, user.publicKey);

  await apiWait();
  const userTokenAccount2 = await createAccount(provider.connection, payer, mint2, user.publicKey);

  await apiWait();
  const userTokenAccount3 = await createAccount(provider.connection, payer, mint3, user.publicKey);

  await apiWait();
  await mintTo(provider.connection, payer, mint1, userTokenAccount1, mintAuthority1, 10000);

  await apiWait();
  await mintTo(provider.connection, payer, mint2, userTokenAccount2, mintAuthority2, 10000);

  await apiWait();
  await mintTo(provider.connection, payer, mint3, userTokenAccount3, mintAuthority3, 10000);

  await apiWait();
  const ammTokenAccount1 = await createAccount(provider.connection, payer, mint1, amm.publicKey);

  await apiWait();
  const ammTokenAccount2 = await createAccount(provider.connection, payer, mint2, amm.publicKey);

  await apiWait();
  const ammTokenAccount3 = await createAccount(provider.connection, payer, mint3, amm.publicKey);

  await apiWait();
  await mintTo(provider.connection, payer, mint1, ammTokenAccount1, mintAuthority1, 10000);

  await apiWait();
  await mintTo(provider.connection, payer, mint2, ammTokenAccount2, mintAuthority2, 10000);

  const env = {
    provider,
    program,

    mint1: mint1,
    mint2: mint2,

    payer,

    user: {
      keypair: user,
      token1: userTokenAccount1,
      token2: userTokenAccount2,
      token3: userTokenAccount3,
    },

    amm: {
      keypair: amm,
      token1: ammTokenAccount1,
      token2: ammTokenAccount2,
      token3: ammTokenAccount3,
    },
  } as TestEnv;

  logEnvironment(env);

  return env;
}
