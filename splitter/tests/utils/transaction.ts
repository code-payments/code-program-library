import { TestEnv } from './test-env';
import { api_wait } from './wait';
import { base64, bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { sendAndConfirmRawTransaction, Signer, Transaction, TransactionInstruction } from '@solana/web3.js';

export interface Result {
    tx: Transaction;
    rawTx: Buffer;
    signatures: String[];
    message: String;
}

export async function sendAndConfirm(env: TestEnv, tx: Result): Promise<String> {
    await sendAndConfirmRawTransaction(env.provider.connection, tx.rawTx, {
        skipPreflight: false,
        commitment: "recent",
    });

    return tx.signatures[0];
}

export async function submitSignedTransaction(env: TestEnv, tx: Transaction): Promise<String> {
    const { rawTx, signatures, message } = logTransaction(tx);

    await sendAndConfirmRawTransaction(env.provider.connection, tx.serialize(), {
        skipPreflight: false,
        commitment: "recent",
    });

    return signatures[0];
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

    const { rawTx, signatures, message } = logTransaction(tx);

    return { 
        tx, rawTx, signatures, message
    };
}

export function logTransaction(tx: Transaction) {
    const rawTx = tx.serialize();
    const signatures = tx.signatures.map(sig => bs58.encode(sig.signature));
    const message = base64.encode(tx.serializeMessage());

    // Taken from the solana explorer (double encoding is not an accident)
    console.log(`https://explorer.solana.com/tx/inspector?signatures=${encodeURIComponent(encodeURIComponent(JSON.stringify(signatures)))}&message=${encodeURIComponent(encodeURIComponent(message))}\n`);

    return { rawTx, signatures, message };
}