import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

import { 
  PREFIX_POOL_STATE,
  PREFIX_POOL_VAULT,
  PREFIX_COMMITMENT_STATE,
  PREFIX_COMMITMENT_VAULT,
  PREFIX_PROOF,
} from "./config";

import * as splitterProgram from '../../client/typescript/src/generated';

export async function getPoolPda(mint: PublicKey, authority: PublicKey, name: string) : Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [
      Buffer.from(PREFIX_POOL_STATE),
      mint.toBuffer(),
      authority.toBuffer(),
      Buffer.from(name),
    ],
    splitterProgram.PROGRAM_ID
  )
}

export async function getPoolVaultPda(pool: PublicKey) : Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [
      Buffer.from(PREFIX_POOL_VAULT),
      pool.toBuffer()
    ],
    splitterProgram.PROGRAM_ID
  )
}

export async function getCommitmentPda(pool: PublicKey, recentRoot: Buffer, transcript: Buffer, destination: PublicKey, amount: number) : Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [
      Buffer.from(PREFIX_COMMITMENT_STATE),
      pool.toBuffer(),
      recentRoot,
      transcript,
      destination.toBuffer(),
      new anchor.BN(amount).toBuffer('le', 8)
    ],
    splitterProgram.PROGRAM_ID
  )
}

export async function getCommitmentVaultPda(pool: PublicKey, commitment: PublicKey) : Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [
      Buffer.from(PREFIX_COMMITMENT_VAULT),
      pool.toBuffer(),
      commitment.toBuffer(),
    ],
    splitterProgram.PROGRAM_ID
  )
}

export async function getProofPda(pool: PublicKey, merkleRoot: Buffer, commitment: PublicKey) : Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [
      Buffer.from(PREFIX_PROOF),
      pool.toBuffer(),
      merkleRoot,
      commitment.toBuffer(),
    ],
    splitterProgram.PROGRAM_ID
  )
}
