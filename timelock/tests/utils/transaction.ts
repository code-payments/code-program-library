import { base64, bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { Signer, Transaction, TransactionInstruction } from '@solana/web3.js';
import { TestEnv } from './test-env';
import { api_wait } from './wait';

export interface Result {
    tx: Transaction;
    rawTx: Buffer;
    signatures: String[];
    message: String;
}

export async function createAndSignTransaction(
    env: TestEnv,
    instructions: TransactionInstruction[],
    signers: Signer[],
): Promise<Result> {

    await api_wait(); // prevent API spam

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

    //console.log(`tx (b64): ${base64.encode(rawTx)}\n`);
    //console.log(`signatures (b58): ${signatures}\n`);
    //console.log(`message (b64): ${message}\n\n`);

    console.log(`tx size: ${rawTx.length}\n`);

    // Print out a link for debugging unsubmitted transactions
    console.log(`https://explorer.solana.com/tx/inspector?signatures=${encodeURIComponent(encodeURIComponent(JSON.stringify(signatures)))}&message=${encodeURIComponent(encodeURIComponent(message))}\n`);

    return { 
        tx, rawTx, signatures, message
    };
}