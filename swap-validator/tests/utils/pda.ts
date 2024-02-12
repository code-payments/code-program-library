import { PublicKey } from "@solana/web3.js";
import { PREFIX_PRE_SWAP_STATE } from "../utils/config";
import { TestEnv } from "../utils/test-env";

export async function getPreSwapStatePda(env: TestEnv, nonce: PublicKey) : Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [
      Buffer.from(PREFIX_PRE_SWAP_STATE),
      env.user.token1.toBuffer(),
      env.user.token2.toBuffer(),
      nonce.toBuffer(),
    ],
    env.program.programId
  )
}
