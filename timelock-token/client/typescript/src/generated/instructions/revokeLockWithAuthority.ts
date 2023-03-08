/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as splToken from '@solana/spl-token'
import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category RevokeLockWithAuthority
 * @category generated
 */
export type RevokeLockWithAuthorityInstructionArgs = {
  timelockBump: number
}
/**
 * @category Instructions
 * @category RevokeLockWithAuthority
 * @category generated
 */
const revokeLockWithAuthorityStruct = new beet.BeetArgsStruct<
  RevokeLockWithAuthorityInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['timelockBump', beet.u8],
  ],
  'RevokeLockWithAuthorityInstructionArgs'
)
/**
 * Accounts required by the _revokeLockWithAuthority_ instruction
 * @category Instructions
 * @category RevokeLockWithAuthority
 * @category generated
 */
export type RevokeLockWithAuthorityInstructionAccounts = {
  timelock: web3.PublicKey
  vault: web3.PublicKey
  timeAuthority: web3.PublicKey
  payer: web3.PublicKey
}

const revokeLockWithAuthorityInstructionDiscriminator = [
  229, 181, 58, 242, 171, 8, 201, 144,
]

/**
 * Creates a _RevokeLockWithAuthority_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category RevokeLockWithAuthority
 * @category generated
 */
export function createRevokeLockWithAuthorityInstruction(
  accounts: RevokeLockWithAuthorityInstructionAccounts,
  args: RevokeLockWithAuthorityInstructionArgs
) {
  const { timelock, vault, timeAuthority, payer } = accounts

  const [data] = revokeLockWithAuthorityStruct.serialize({
    instructionDiscriminator: revokeLockWithAuthorityInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: timelock,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: vault,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: timeAuthority,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: payer,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: splToken.TOKEN_PROGRAM_ID,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: web3.SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
  ]

  const ix = new web3.TransactionInstruction({
    programId: new web3.PublicKey(
      'time2Z2SCnn3qYg3ULKVtdkh8YmZ5jFdKicnA1W2YnJ'
    ),
    keys,
    data,
  })
  return ix
}
