import * as test from "../utils/splitter-instructions";
import * as spl from "../utils/spl-instructions";

import { AnchorProvider } from "@project-serum/anchor";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
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

const isValid = (env: TestEnv, tx: Transaction) => { return true; /* It is up to the pool authority to decide what constitutes a valid transaction. */ }

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
        const blindSend = sha256(Buffer.from("no strings attached"));
        const recentRoot = env.pool.merkleTree.root;
        const [commitment, _] = await getCommitmentPda(env.pool.address, recentRoot, blindSend, env.bob.token, 10);

        await test.transferWithCommitment(env, env.bob.token, 10, commitment, blindSend, recentRoot)

        // Add the commitment locally
        env.pool.merkleTree.addLeaf(commitment.toBuffer());

        // Check that the root has changed. It should have;
        // transferWithCommitment always adds the commitment to the merkle tree.
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

    // Our local merkle tree (we'll use this to generate proofs and match the
    // state of the on-chain merkle tree)
    const merkleTree = env.pool.merkleTree;
    const recentRoot = merkleTree.root; // We can optionally use the
                                        // on-chain root here but we know it
                                        // will be the same value because
                                        // only the pool authority can sign
                                        // to add leaves to the tree. No
                                        // concurrent merkle tree updates
                                        // are possible without the pool
                                        // authority knowing about it.

    // This should succeed.
    try {
        await test.createPool(env); // On-chain merkle tree for our pool is empty at this point

        // Send the pool 1000 tokens
        await env.mintTo(env.pool.vault, 1000);

        // Alice sends 10 tokens to Bob through a common pool.
        const payment = getPaymentDetails({ env, src: env.alice.token, dest: env.bob.token, amount: 10 });
        const transcript = getTranscript(payment); // <- Sha256 hash of the payment details

        // We're going to generate a commitment value, from the sha256 hash of
        // the payment details, that will eventually be sent to the splitter
        // program as part of a transferWithCommitment instruction. The on-chain
        // program will store the commitment in its next right-most empty leaf
        // node in its merkle tree. The commitment is needed to open a
        // conditional vault that can only be opened if the pool has paid Bob 10
        // tokens first. 

        const [commitment, _] = await getCommitmentPda(env.pool.address, recentRoot, transcript, env.bob.token, 10);
        const [conditionalVault, conditionalVaultBump] = await getCommitmentVaultPda(env.pool.address, commitment);
        
        // Alice can use this pre-calculated commitment to get a PDA to a vault
        // that can only be opened if the pool has paid Bob 10 tokens *first*.
        // The commitment can only be added to the pool's merkle tree when the
        // pool sends Bob 10 tokens first. This essentially creates a
        // proof-of-payment condition.

        // Alice sends 10 tokens to the pool; conditional on a proof-of-payment
        // (commitment) that Bob was paid 10 tokens first.

        // Note: both of these transactions can be signed at the same time by
        // each party independently.
        const aliceToPool = await spl.createTransfer(env, env.alice, conditionalVault, payment.amount);
        const poolToBob = await test.createTransferWithCommitment(env, env.bob.token, 10, commitment, transcript, recentRoot);

        if (!isValid(env, aliceToPool.tx)) {
            // The pool authority can reject the transaction if it doesn't
            // like the commitment value or anything about the transaction.
            // Typically, the transaction should be against a durable nonce, and
            // it should use a Timelock. We don't here for simplicity.
            return;
        }

        // Once the pool authority is happy with the *signed* aliceToPool
        // transaction it has been given, it can start the process by sending
        // the poolToBob transaction to the network. Usually, the aliceToPool
        // transaction would use a Timelock and durable nonce; it can be
        // submitted at any time later with the garantee that it will succeed
        // (otherwise there could be loss of funds).
        await sendAndConfirm(env, poolToBob);
        merkleTree.addLeaf(commitment.toBuffer());

        // In the mean-time, the pool authority might be asked to do some
        // unrelated payments for other users (these are blind here for
        // simplicity)
        let unrelatedPayments = 0; // Sum of all payments to unrelated users
        for (let i = 0; i < 10; i++) {
            const blindSend = sha256(Buffer.from("unrelated payment " + i));
            const [commitment, _] = await getCommitmentPda(env.pool.address, recentRoot, blindSend, env.charlie.token, i);
            await test.transferWithCommitment(env, env.charlie.token, i, commitment, blindSend, recentRoot);
            merkleTree.addLeaf(commitment.toBuffer());
            unrelatedPayments += i;
        }

        // The following set of actions are required to open a conditional token
        // account. At a high level, we're creating a setup to prove to the
        // splitter program that it has a recent root stored that contains a
        // commitment we want to open a conditional vault for.
        
        await test.saveRecentRoot(env); // Note that it is possible to defer
                                        // calling saveRecentRoot if we can
                                        // provide Alice with a proof that a
                                        // later merkle root contains the
                                        // commitment she cares about. This is
                                        // useful if we need to break the
                                        // connection between the split
                                        // transfers by not referencing the same
                                        // commitment id on both sides of the
                                        // split. We're not doing that here for
                                        // simplicity.
                            
        const leafIndex = merkleTree.getIndexForLeaf(commitment.toBuffer());
        const merkleProof = merkleTree.getProofFor(commitment.toBuffer(), leafIndex);
        const [proof, proofBump] = await test.createProof(env, commitment, merkleTree.root, merkleProof);
        await test.openTokenAccount(env, proof, proofBump, conditionalVault);

        // Make the pool whole again by sending the 10 tokens to the conditional
        // vault and closing the conditional vault (which will automatically
        // send the 10 tokens to the pool)
        await sendAndConfirm(env, aliceToPool);
        await test.closeTokenAccount(env, proof, proofBump, conditionalVault, conditionalVaultBump);
        await test.closeProof(env, proof, proofBump);

        // At this point the pool should have its 10 tokens back from the Alice
        // to Bob interaction
        const res = await provider.connection.getTokenAccountBalance(env.pool.vault)
        assert.equal(res.value.uiAmount, 1000 - unrelatedPayments);

    } catch(e) {
        console.log(e)
        assert.ok(false);
    }
}