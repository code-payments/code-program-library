import * as test from "../utils/splitter-instructions";
import * as spl from "../utils/spl-instructions";

import { AnchorProvider } from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { TestEnv } from "../utils/test-env";
import { assert } from "chai";
import { getCommitmentPda, getCommitmentVaultPda } from "../utils/pda";
import { newTestEnv } from './env';
import { sha256 } from "../utils/sha256";
import { sendAndConfirm } from "../utils/transaction";

interface Payment {
    mint: PublicKey;
    src: PublicKey;
    dest: PublicKey;
    amount: number;
    timestamp: number;
    nonce: Buffer;
}

const getPaymentDetails = (opt: {env: TestEnv, src: PublicKey, dest: PublicKey, amount: number}) : Payment => {
    const mint = opt.env.mint;
    const timestamp = Date.now();
    const nonce = Keypair.generate().publicKey.toBuffer();
    return { mint, src:opt.src, dest:opt.dest, amount:opt.amount, timestamp, nonce, }
}

const getTranscript = (payment: Payment) => {
    const seeds = Buffer.concat([
        payment.mint.toBuffer(),
        payment.src.toBuffer(),
        payment.dest.toBuffer(),
        Buffer.from(payment.amount.toString()),
        Buffer.from(payment.timestamp.toString()),
        payment.nonce,
    ]);
    return sha256(seeds);
}

export async function test_create_pool(provider: AnchorProvider) {
    console.log("test_create_pool");

    const env = await newTestEnv(provider);

    // This should succeed.
    try {
        await test.createPool(env)

        // Check that the pool merkle root matches the local merkle root
        const pool = await test.getPoolAccount(env, env.pool.address);
        assert.equal(
            Buffer.from(env.pool.merkleTree.root).toString(), 
            Buffer.from(pool.merkleTree.root).toString());

    } catch(e) {
        console.log(e)
        assert.ok(false);
    }
}

export async function test_blind_transfer(provider: AnchorProvider) {
    console.log("test_blind_transfer");

    const env = await newTestEnv(provider);

    // This should succeed.
    try {
        await test.createPool(env);

        // Send the pool 1000 tokens
        await env.mintTo(env.pool.vault, 1000);

        // Ask the pool to send 10 tokens to Bob, no strings attached
        const payment = getPaymentDetails({ env, src: env.pool.vault, dest: env.bob.token, amount: 10 });
        const transcript = getTranscript(payment);
        const recentRoot = env.pool.merkleTree.root;
        const [commitment, _] = await getCommitmentPda(env.pool.address, recentRoot, transcript, env.bob.token, 10);

        await test.transferWithCommitment(env, env.bob.token, 10, commitment, transcript, recentRoot)

        // Add the commitment locally
        env.pool.merkleTree.addLeaf(commitment.toBuffer());

        // Check that the root has changed
        const newRoot = env.pool.merkleTree.root;
        const pool = await test.getPoolAccount(env, env.pool.address);

        assert.equal(Buffer.from(pool.merkleTree.root).toString(), newRoot.toString());
    } catch(e) {
        console.log(e)
        assert.ok(false);
    }
}

export async function test_create_proof_of_payment(provider: AnchorProvider) {
    console.log("test_create_proof_of_payment");

    const env = await newTestEnv(provider);

    // This should succeed.
    try {
        await test.createPool(env);

        // Send the pool 1000 tokens
        await env.mintTo(env.pool.vault, 1000);

        // Alice sends 10 tokens to the pool; conditional on a proof-of-payment (commitment) that Bob was paid 10 tokens first.
        const payment = getPaymentDetails({ env, src: env.alice.token, dest: env.bob.token, amount: 10 });
        const transcript = getTranscript(payment);

        // Use our local merkle tree to generate a commitment (and its conditional vault)
        const merkleTree = env.pool.merkleTree;
        const recentRoot = merkleTree.root;
        const [commitment, _a] = await getCommitmentPda(env.pool.address, recentRoot, transcript, env.bob.token, 10);

        // Pay Bob 10 tokens; and add the commitment to the pool's merkle tree
        await test.transferWithCommitment(env, env.bob.token, 10, commitment, transcript, recentRoot)

        // Ask the pool to store the merkle root so that proofs can be verified off of it
        await test.saveRecentRoot(env);

        // Add the commitment to our local merkle tree
        merkleTree.addLeaf(commitment.toBuffer());
        const leafIndex = merkleTree.getIndexForLeaf(commitment.toBuffer());
        const merkleProof = merkleTree.getProofFor(commitment.toBuffer(), leafIndex);

        // Check that the local root matches the pool's root
        const pool = await test.getPoolAccount(env, env.pool.address);
        assert.equal(
            Buffer.from(pool.merkleTree.root).toString(),
            merkleTree.root.toString());

        // Create an an on-chain proof-of-payment
        await test.createProof(env, commitment, merkleTree.root, merkleProof);

    } catch(e) {
        console.log(e)
        assert.ok(false);
    }
}


export async function test_create_conditional_token_account(provider: AnchorProvider) {
    console.log("test_create_conditional_token_account");

    const env = await newTestEnv(provider);

    // This should succeed.
    try {
        await test.createPool(env);

        // Send the pool 1000 tokens
        await env.mintTo(env.pool.vault, 1000);

        // Alice sends 10 tokens to the pool; conditional on a proof-of-payment (commitment) that Bob was paid 10 tokens first.
        const payment = getPaymentDetails({ env, src: env.alice.token, dest: env.bob.token, amount: 10 });
        const transcript = getTranscript(payment);

        // Use our local merkle tree to generate a commitment (and its conditional vault)
        const merkleTree = env.pool.merkleTree;
        const recentRoot = merkleTree.root;
        const [commitment, _a] = await getCommitmentPda(env.pool.address, recentRoot, transcript, env.bob.token, 10);
        const [conditionalVault, _b] = await getCommitmentVaultPda(env.pool.address, commitment);

        // Pay Bob 10 tokens; and add the commitment to the pool's merkle tree
        await test.transferWithCommitment(env, env.bob.token, 10, commitment, transcript, recentRoot)
        await test.saveRecentRoot(env);

        // Add the commitment to our local merkle tree
        merkleTree.addLeaf(commitment.toBuffer());
        const leafIndex = merkleTree.getIndexForLeaf(commitment.toBuffer());
        const merkleProof = merkleTree.getProofFor(commitment.toBuffer(), leafIndex);

        // Create an an on-chain proof-of-payment
        const [proof, bump] = await test.createProof(env, commitment, merkleTree.root, merkleProof);

        // Open the conditional vault that can receive the tokens from Alice
        await test.openTokenAccount(env, proof, bump, conditionalVault);

    } catch(e) {
        console.log(e)
        assert.ok(false);
    }
}

export async function test_split_payment(provider: AnchorProvider) {
    console.log("test_split_payment");

    const env = await newTestEnv(provider);

    // This should succeed.
    try {
        await test.createPool(env);

        // Send the pool 1000 tokens
        await env.mintTo(env.pool.vault, 1000);

        // Alice sends 10 tokens to the pool; conditional on a proof-of-payment
        // (commitment) that Charlie was paid 10 tokens first.
        const payment = getPaymentDetails({ env, src: env.alice.token, dest: env.bob.token, amount: 10 });
        const transcript = getTranscript(payment);

        // Use our local merkle tree to generate a commitment (and its conditional vault)
        const merkleTree = env.pool.merkleTree;
        const recentRoot = merkleTree.root;
        const [commitment, _] = await getCommitmentPda(env.pool.address, recentRoot, transcript, env.bob.token, 10);
        const [conditionalVault, conditionalVaultBump] = await getCommitmentVaultPda(env.pool.address, commitment);

        // Both transactions can be signed at the same time by each party
        const aliceToPool = await spl.createTransfer(env, env.alice, conditionalVault, payment.amount);
        const poolToBob = await test.createTransferWithCommitment(env, env.bob.token, 10, commitment, transcript, recentRoot);

        // Once the pool authority is happy with the aliceToPool transaction, it
        // can start the process by sending the poolToBob transaction to the
        // network. Usually, the aliceToPool transaction would use a Timelock
        // and durable nonce; it can be submitted at any time later with the
        // garantee that it will succeed (otherwise there could be loss of
        // funds).
        await sendAndConfirm(env, poolToBob);

        // Setup required to open the conditional vault
        await test.saveRecentRoot(env);
        merkleTree.addLeaf(commitment.toBuffer());
        const leafIndex = merkleTree.getIndexForLeaf(commitment.toBuffer());
        const merkleProof = merkleTree.getProofFor(commitment.toBuffer(), leafIndex);
        const [proof, proofBump] = await test.createProof(env, commitment, merkleTree.root, merkleProof);
        await test.openTokenAccount(env, proof, proofBump, conditionalVault);

        await sendAndConfirm(env, aliceToPool);
        await test.closeTokenAccount(env, proof, proofBump, conditionalVault, conditionalVaultBump);
        await test.closeProof(env, proof, proofBump);

        // At this point the pool should have its 10 tokens back
        const res = await provider.connection.getTokenAccountBalance(env.pool.vault)
        assert.equal(res.value.uiAmount, 1000);


    } catch(e) {
        console.log(e)
        assert.ok(false);
    }

    console.log(env.pool.merkleTree.prettyPrint());
}