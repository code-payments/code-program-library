
import { PublicKey, Transaction, TransactionInstruction, } from "@solana/web3.js";
import { TestEnv } from "./test-env";
import { api_wait } from "../utils/wait";
import { createAndSignTransaction, Result, sendAndConfirm } from "../utils/transaction";
import { getProofPda } from "../utils/pda";

import * as program from '../../client/typescript/src/generated';

export function createPoolInstruction(
    env: TestEnv,
    name: string,
    levels: number,
): TransactionInstruction {
    const ix = program.createInitializePoolInstruction(
        {
            pool: env.pool.address,                 // pool state
            vault: env.pool.vault,                  // pool vault
            mint: env.mint,                         // type of token account
            payer: env.payer.publicKey,             // who pays for the rent on the timelock state and vault
            authority: env.payer.publicKey,         // who has authority over the treasury
        },
        {
            name,
            levels,
        }
    );

    return ix;
}


export async function createPool(
    env: TestEnv,
): Promise<String> {
    const name = env.pool.name;
    const levels = env.pool.merkleTree.levels;

    const ix = createPoolInstruction(env, name, levels);

    const tx = await createAndSignTransaction(env,
        [ ix ],
        [ env.payer ]
    );

    return sendAndConfirm(env, tx);
}

export function saveRecentRootInstruction(env: TestEnv) : TransactionInstruction {
    const ix = program.createSaveRecentRootInstruction(
        {
            pool: env.pool.address,     // pool state
            authority: env.payer.publicKey, // who owns the treasury
            payer: env.payer.publicKey,     // who pays for the rent
        },
        {
            poolBump: env.pool.bump,
        }
    )

    return ix;
}

export async function saveRecentRoot(env: TestEnv) : Promise<String> {
    const ix = saveRecentRootInstruction(env);

    const tx = await createAndSignTransaction(env,
        [ ix ],
        [ env.payer ]
    );

    return sendAndConfirm(env, tx);
}

export function transferWithCommitmentInstruction(
    env: TestEnv,
    destination: PublicKey,
    amount: number,
    commitment: PublicKey,
    transcript: Buffer,
    recentRoot: Buffer
) : TransactionInstruction {

    const ix = program.createTransferWithCommitmentInstruction(
        {
            commitment: commitment,
            destination,                    // where are the tokens going?
            pool: env.pool.address,         // pool state
            vault: env.pool.vault,          // pool vault
            authority: env.payer.publicKey, // who owns the treasury
            payer: env.payer.publicKey,     // who pays for the rent
        },
        {
            poolBump: env.pool.bump,
            amount: amount,
            transcript: [... transcript],
            recentRoot: [...recentRoot]
        }
    )

    return ix;
}

export async function createTransferWithCommitment(
    env: TestEnv,
    destination: PublicKey,
    amount: number,
    commitment: PublicKey,
    transcript: Buffer,
    recentRoot: Buffer
) : Promise<Result> {
    const ix = transferWithCommitmentInstruction(env, destination, amount, commitment, transcript, recentRoot);

    return await createAndSignTransaction(env,
        [ ix ],
        [ env.payer ]
    );
}

export async function transferWithCommitment(
    env: TestEnv,
    destination: PublicKey,
    amount: number,
    commitment: PublicKey,
    transcript: Buffer,
    recentRoot: Buffer
) : Promise<String> {
    const tx = await createTransferWithCommitment(env, destination, amount, commitment, transcript, recentRoot);

    return sendAndConfirm(env, tx);
}


export function initializeProofInstruction(
    env: TestEnv,
    commitment: PublicKey,
    proof: PublicKey,
    merkleRoot: Buffer,
) {

    const ix = program.createInitializeProofInstruction(
        {
            pool: env.pool.address,
            authority: env.payer.publicKey,
            payer: env.payer.publicKey,
            proof,
        },
        {
            poolBump: env.pool.bump,
            merkleRoot: [...merkleRoot],
            commitment,
        }
    )

    return ix;
}

export async function initializeProof(
    env: TestEnv,
    commitment: PublicKey,
    proof: PublicKey,
    merkleRoot: Buffer,
) {

    const ix = initializeProofInstruction(env, commitment, proof, merkleRoot);

    const tx = await createAndSignTransaction(env,
        [ ix ],
        [ env.payer ]
    );

    return sendAndConfirm(env, tx);
}


export function uploadProofInstruction(
    env: TestEnv,
    proof: PublicKey,
    proofBump: number,
    currentSize: number,
    data: Array<Buffer>,
) {
    const ix = program.createUploadProofInstruction(
        {
            pool: env.pool.address,
            authority: env.payer.publicKey,
            payer: env.payer.publicKey,
            proof,
        },
        {
            poolBump: env.pool.bump,
            proofBump,
            currentSize,
            dataSize: data.length,
            data: data.map(d => [...d]),
        }
    )

    return ix;
}

export async function uploadProof(
    env: TestEnv,
    proof: PublicKey,
    proofBump: number,
    currentSize: number,
    data: Array<Buffer>,
) {
    const ix = uploadProofInstruction(env, proof, proofBump, currentSize, data);
    const tx = await createAndSignTransaction(env,
        [ ix ],
        [ env.payer ]
    );

    return sendAndConfirm(env, tx);
}

export function verifyProofInstruction(
    env: TestEnv,
    proof: PublicKey,
    proofBump: number,
) {
    const ix = program.createVerifyProofInstruction(
        {
            pool: env.pool.address,
            authority: env.payer.publicKey,
            payer: env.payer.publicKey,
            proof,
        },
        {
            poolBump: env.pool.bump,
            proofBump,
        }
    )

    return ix;
}

export async function verifyProof(
    env: TestEnv,
    proof: PublicKey,
    proofBump: number,
) {
    const ix = verifyProofInstruction(env, proof, proofBump);
    const tx = await createAndSignTransaction(env,
        [ ix ],
        [ env.payer ]
    );

    return sendAndConfirm(env, tx);
}

export function closeProofInstruction(
    env: TestEnv,
    proof: PublicKey,
    proofBump: number,
) {

    const ix = program.createCloseProofInstruction(
        {
            pool: env.pool.address,
            authority: env.payer.publicKey,
            payer: env.payer.publicKey,
            proof,
        },
        {
            poolBump: env.pool.bump,
            proofBump,
        }
    )

    return ix;
}

export async function closeProof(
    env: TestEnv,
    proof: PublicKey,
    proofBump: number,
) {
    const ix = closeProofInstruction(env, proof, proofBump);

    const tx = await createAndSignTransaction(env,
        [ ix ],
        [ env.payer ]
    );

    return sendAndConfirm(env, tx);
}

// Prove that commitment belongs to recentBlockhash using the merkle proof
export async function createProof(
    env: TestEnv,
    commitment: PublicKey, 
    recentRoot: Buffer,
    merkleProof: Array<Buffer>,
) : Promise<[PublicKey, number]> {

    const [proof, proofBump] = await getProofPda(
        env.pool.address, recentRoot, commitment
    );

    await initializeProof(env, commitment, proof, recentRoot);

    // update the proof, chunkSize items at a time
    const chunkSize = 32;

    let currentSize = 0;
    for (let i = 0; i < merkleProof.length; i += chunkSize) {
        console.log(`Uploading proof chunk ${i}`);
        await uploadProof(env, 
            proof,
            proofBump,
            currentSize,
            merkleProof.slice(i, i + chunkSize)
        );
        currentSize += chunkSize;

        const info = await env.provider.connection.getAccountInfo(proof);
        //console.log(`Proof account data:\n${info.data.toString('hex')}`);
    }

    console.log(`Verifying proof`);

    await verifyProof(env, proof, proofBump);

    return [proof, proofBump];
}

export async function openTokenAccount(
    env: TestEnv,
    proof: PublicKey,
    proofBump: number,
    vault: PublicKey,
) {

    const ix = program.createOpenTokenAccountInstruction(
        {
            pool: env.pool.address,
            authority: env.payer.publicKey,
            payer: env.payer.publicKey,
            mint: env.mint,
            commitmentVault: vault,
            proof,
        },
        {
            poolBump: env.pool.bump,
            proofBump,
        }
    )

    const tx = await createAndSignTransaction(env,
        [ ix ],
        [ env.payer ]
    );

    return sendAndConfirm(env, tx);
}

export function closeTokenAccountInstruction(
    env: TestEnv,
    proof: PublicKey,
    proofBump: number,
    vault: PublicKey,
    vaultBump: number,
) {

    const ix = program.createCloseTokenAccountInstruction(
        {
            pool: env.pool.address,
            poolVault: env.pool.vault,
            authority: env.payer.publicKey,
            payer: env.payer.publicKey,
            commitmentVault: vault,
            proof,
        },
        {
            poolBump: env.pool.bump,
            proofBump,
            vaultBump,
        }
    )

    return ix;
}

export async function closeTokenAccount(
    env: TestEnv,
    proof: PublicKey,
    proofBump: number,
    vault: PublicKey,
    vaultBump: number,
) {

    const ix = closeTokenAccountInstruction(env, proof, proofBump, vault, vaultBump);

    const tx = await createAndSignTransaction(env,
        [ ix ],
        [ env.payer ]
    );

    return sendAndConfirm(env, tx);
}

export async function getPoolAccount(env: TestEnv, address: PublicKey): Promise<program.Pool> {
    await api_wait();

    const info = await env.provider.connection.getAccountInfo(address);
    const [pool, _] = program.Pool.fromAccountInfo(info);

    return pool;
}

export async function getProofAccount(env: TestEnv, address: PublicKey): Promise<program.Proof> {
    await api_wait();

    const info = await env.provider.connection.getAccountInfo(address);
    const [proof, _] = program.Proof.fromAccountInfo(info);

    return proof;
}