import * as anchor from "@project-serum/anchor";
import { base64, bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import {
    sendAndConfirmRawTransaction,
    Keypair,
    Signer,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction,
    TransactionInstruction,
 } from '@solana/web3.js';
import { 
    createApproveInstruction,
    createSetAuthorityInstruction,
    createTransferInstruction,
    AuthorityType,
} from "@solana/spl-token";
import { getPreSwapStatePda } from './pda';
import { TestEnv } from './test-env';
import { apiWait } from './wait';

export interface Result {
    tx: Transaction;
    rawTx: Buffer;
    signatures: String[];
    message: String;
}

export async function swap(
    env: TestEnv,
    sendAmount: number,
    receiveAmount: number,
    maxSendAmount: number,
    minReceiveAmount: number,
    includeMaliciousSourceAccountUpdate: boolean = false,
    includeMaliciousDestinationAccountUpdate: boolean = false,
    includeUserAccountInRemainingAccounts: boolean = false,
): Promise<String> {
    const nonce = Keypair.generate().publicKey;

    const [preSwapState, stateBump] = await getPreSwapStatePda(env, nonce);

    var remainingAccounts = [
        {pubkey: env.mint1, isSigner: false, isWritable: false},
        {pubkey: env.amm.keypair.publicKey, isSigner: false, isWritable: false},
        {pubkey: env.amm.token2, isSigner: false, isWritable: false},
        {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
        {pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false},
     ]
     if (includeUserAccountInRemainingAccounts) {
        remainingAccounts.push({pubkey: env.user.token3, isSigner: false, isWritable: false})
     }

    const preSwapIxn = await env.program.methods.preSwap(
    ).accounts({
        preSwapState: preSwapState,

        user: env.user.keypair.publicKey,
        source: env.user.token1,
        destination: env.user.token2,

        nonce: nonce,

        payer: env.payer.publicKey,

        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();

    // User sends token1 to AMM
    const transferIxn1 = await createTransferInstruction(env.user.token1, env.amm.token1, env.user.keypair.publicKey, sendAmount)

    // User receives token2 from AMM
    const transferIxn2 = await createTransferInstruction(env.amm.token2, env.user.token2, env.amm.keypair.publicKey, receiveAmount)

    const postSwapIxn = await env.program.methods.postSwap(
            stateBump,
            new anchor.BN(maxSendAmount),
            new anchor.BN(minReceiveAmount),
        ).accounts({
            preSwapState: preSwapState,
    
            source: env.user.token1,
            destination: env.user.token2,
    
            payer: env.payer.publicKey,
        }).instruction();


    var maliciousInstruction: anchor.web3.TransactionInstruction
    if (includeMaliciousSourceAccountUpdate) {
        maliciousInstruction = createSetAuthorityInstruction(env.user.token1, env.user.keypair.publicKey, AuthorityType.AccountOwner, env.amm.keypair.publicKey)
    }
    if (includeMaliciousDestinationAccountUpdate) {
        maliciousInstruction = createApproveInstruction(env.user.token2, env.amm.keypair.publicKey, env.user.keypair.publicKey, 1)
    }

    var ixns = [
        preSwapIxn,
        transferIxn1,
        transferIxn2,
    ]
    if (maliciousInstruction != null) {
        ixns.push(maliciousInstruction)
    }
    ixns.push(postSwapIxn)

    const tx = await createAndSignTransaction(env,
        ixns,
        [
            env.user.keypair,
            env.amm.keypair,
        ]
    );

    return sendAndConfirm(env, tx);
}

export async function createAndSignTransaction(
    env: TestEnv,
    instructions: TransactionInstruction[],
    signers: Signer[],
): Promise<Result> {
    await apiWait(); // prevent API spam

    const tx = new Transaction();
    tx.add(...instructions);

    tx.recentBlockhash = (await env.provider.connection.getLatestBlockhash()).blockhash;
    tx.feePayer = env.payer.publicKey;
    tx.partialSign(...[
        env.payer,
        ...signers
    ]);

    const rawTx = tx.serialize();
    const signatures = tx.signatures.map(sig => bs58.encode(sig.signature));
    const message = base64.encode(tx.serializeMessage())

    console.log(`tx size: ${rawTx.length}\n`);

    // Print out a link for debugging unsubmitted transactions
    console.log(`https://explorer.solana.com/tx/inspector?signatures=${encodeURIComponent(encodeURIComponent(JSON.stringify(signatures)))}&message=${encodeURIComponent(encodeURIComponent(message))}\n`);

    return { 
        tx, rawTx, signatures, message
    };
}

async function sendAndConfirm(env: TestEnv, tx: Result): Promise<String> {
    await sendAndConfirmRawTransaction(env.provider.connection, tx.rawTx, {
        skipPreflight: false,
        commitment: "recent",
    });

    return tx.signatures[0];
}
