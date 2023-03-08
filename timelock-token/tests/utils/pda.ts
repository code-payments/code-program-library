import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { 
  PREFIX_TIMELOCK_STATE,
  PREFIX_TIMELOCK_VAULT,
} from "../utils/config";
import { TestEnv } from "../utils/test-env";

export async function getTimelockStatePda(env: TestEnv, owner: PublicKey) : Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [
      Buffer.from(PREFIX_TIMELOCK_STATE),
      env.mint.toBuffer(),
      env.payer.publicKey.toBuffer(),
      owner.toBuffer(),
      new anchor.BN(10).toBuffer('le', 1),
    ],
    env.program.programId
  )
}

export async function getTimelockVaultPda(env: TestEnv, timelock: PublicKey) : Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [
      Buffer.from(PREFIX_TIMELOCK_VAULT),
      timelock.toBuffer(),
      Buffer.from([0x03]), // VERSION_1 == uint8(3)
    ],
    env.program.programId
  )
}