import * as anchor from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    sendAndConfirmRawTransaction,
    SystemProgram,
    SYSVAR_RENT_PUBKEY
} from "@solana/web3.js";
import { TestEnv } from "./test-env";
import { createAndSignTransaction, Result } from "./transaction";
import { api_wait } from "./wait";


export async function createTimelock(env: TestEnv): Promise<String> {
    const duration = 10; // days
    
    // This instruction creates the timelock account (state and vault). No
    // funds are moved other than paying for the rent exemption. The timelock is
    // not yet active and a duration has yet to be decided.

    const ix = await env.program.methods.initialize(
        duration,                                   // timelock duration (in units of days)
    ).accounts({
        timelock: env.timelock,                     // timelock state
        vault: env.vault,                           // timelock vault
        vaultOwner: env.alice.keypair.publicKey,    // who has transfer authority
        mint: env.mint,                             // type of token account
        timeAuthority: env.payer.publicKey,         // who has time authority
        payer: env.payer.publicKey,                 // who pays for the rent on the timelock state and vault
        tokenProgram: TOKEN_PROGRAM_ID,             // SPL token program
        systemProgram: SystemProgram.programId,     // system program
        rent: SYSVAR_RENT_PUBKEY,                   // rent sysvar
    }).instruction();

    const tx = await createAndSignTransaction(env,
        [ ix ],
        [ ]
    );

    return sendAndConfirm(env, tx);
}

export async function activateTimelock(env: TestEnv): Promise<String> {
    // Alice agrees to a timelock duration with a time_authority. The vault will
    // be locked after this instruction.

    const ix = await env.program.methods.activate(
        env.timelockBump,
    ).accounts({
        timelock: env.timelock,                     // timelock state
        vaultOwner: env.alice.keypair.publicKey,    // who has transfer authority
        payer: env.payer.publicKey,                 // who pays for the rent on the timelock state and vault
    }).instruction();

    const tx = await createAndSignTransaction(env,
        [ ix ],
        [ env.alice.keypair ]
    );

    return sendAndConfirm(env, tx);
}

export async function deactivateTimelock(env: TestEnv): Promise<String> {
    // Alice waits for the timeout to expire and then deactivates the timelock.

    const ix = await env.program.methods.deactivate(
        env.timelockBump,
    ).accounts({
        timelock: env.timelock,                     // timelock state
        vaultOwner: env.alice.keypair.publicKey,    // the destination authority
        payer: env.payer.publicKey,                 // the account that pays the SOL fee for the transaction
    }).instruction();

    const tx = await createAndSignTransaction(env,
        [ ix ],
        [ env.alice.keypair ]
    );

    return sendAndConfirm(env, tx);
}

export async function withdrawFromTimelock(env: TestEnv): Promise<String> {
    // Alice wants to withdraw all tokens from the unlocked vault. She should
    // now be able to do so.

    const ix = await env.program.methods.withdraw(
        env.timelockBump,
    ).accounts({
        timelock: env.timelock,                     // timelock state
        vault: env.vault,                           // timelock vault
        vaultOwner: env.alice.keypair.publicKey,    // the destination authority
        destination: env.alice.token,               // the destination token account (must be owned by the destination authority)
        payer: env.payer.publicKey,                 // the account that pays the SOL fee for the transaction
        tokenProgram: TOKEN_PROGRAM_ID,             // SPL token program
        systemProgram: SystemProgram.programId,     // system program
    }).instruction();

    const tx = await createAndSignTransaction(env,
        [ ix ],
        [ env.alice.keypair ]
    );

    return sendAndConfirm(env, tx);
}

export async function transferWithAuthority(env: TestEnv, amount: number): Promise<String> {
    // Move <amount> tokens from the vault using the transferWithAuthority instruction.

    const ix = await env.program.methods.transferWithAuthority(
        env.timelockBump,
        new anchor.BN(amount),
    ).accounts({
        timelock: env.timelock,                     // timelock state
        vault: env.vault,                           // timelock vault
        vaultOwner: env.alice.keypair.publicKey,    // who has transfer authority
        destination: env.bob.token,                 // destination token account
        timeAuthority: env.payer.publicKey,         // who has time authority
        payer: env.payer.publicKey,                 // who pays for the rent on the timelock state and vault
        tokenProgram: TOKEN_PROGRAM_ID,             // SPL token program
        systemProgram: SystemProgram.programId,     // system program
    }).instruction();

    const tx = await createAndSignTransaction(env,
        [ ix ],
        [ env.alice.keypair ]
    );

    return sendAndConfirm(env, tx);
}

export async function burnDustWithAuthority(env: TestEnv, max_amount: number): Promise<String> {
    // Burn all dust (up to max_amount tokens) from the vault using the burnDustWithAuthority instruction.

    const ix = await env.program.methods.burnDustWithAuthority(
        env.timelockBump,
        new anchor.BN(max_amount),
    ).accounts({
        timelock: env.timelock,                     // timelock state
        vault: env.vault,                           // timelock vault
        vaultOwner: env.alice.keypair.publicKey,    // who has transfer authority
        timeAuthority: env.payer.publicKey,         // who has time authority
        payer: env.payer.publicKey,                 // who pays for the rent on the timelock state and vault
        mint: env.mint,
        tokenProgram: TOKEN_PROGRAM_ID,             // SPL token program
        systemProgram: SystemProgram.programId,     // system program
    }).instruction();

    const tx = await createAndSignTransaction(env,
        [ ix ],
        [ env.alice.keypair ]
    );

    return sendAndConfirm(env, tx);
}

export async function revokeWithTimeout(env: TestEnv): Promise<String> {
    // Alice decides she doesn't want to use the timelock anymore. She can
    // revoke the timelock by sending a transaction to begin the porcess of
    // opening the lock without the time_authority. 

    const ix = await env.program.methods.revokeLockWithTimeout(
        env.timelockBump,
    ).accounts({
        timelock: env.timelock,                     // timelock state
        vault: env.vault,                           // timelock vault
        vaultOwner: env.alice.keypair.publicKey,    // who has transfer authority
        payer: env.payer.publicKey,                 // who pays the SOL fee for the transaction 
        tokenProgram: TOKEN_PROGRAM_ID,             // SPL token program
        systemProgram: SystemProgram.programId,     // system program
    }).instruction();

    const tx = await createAndSignTransaction(env,
        [ ix ],
        [ env.alice.keypair ]
    );

    return sendAndConfirm(env, tx);
}

export async function revokeWithAuthority(env: TestEnv): Promise<String> {
    // Alice decides she doesn't want to use the timelock anymore. This time she
    // decides to reach out to the time_authority to get help with unlocking the
    // account faster.

    const ix = await env.program.methods.revokeLockWithAuthority(
        env.timelockBump,
    ).accounts({
        timelock: env.timelock,                     // timelock state
        vault: env.vault,                           // timelock vault
        timeAuthority: env.payer.publicKey,         // who has time authority
        payer: env.payer.publicKey,                 // who pays the SOL fee for the transaction 
        tokenProgram: TOKEN_PROGRAM_ID,             // SPL token program
        systemProgram: SystemProgram.programId,     // system program
    }).instruction();

    const tx = await createAndSignTransaction(env,
        [ ix ],
        [ ]
    );

    return sendAndConfirm(env, tx);
}

export async function cancelTimeout(env: TestEnv): Promise<String> {
    // Alice issued a revokeWithTimeout transaction outside our control. This
    // instruction allows us to cancel the timeout period.

    const ix = await env.program.methods.cancelLockTimeout(
        env.timelockBump,
    ).accounts({
        timelock: env.timelock,                     // timelock state
        timeAuthority: env.payer.publicKey,         // who has time authority
        payer: env.payer.publicKey,                 // who pays the SOL fee for the transaction 
        systemProgram: SystemProgram.programId,     // system program
    }).instruction();

    const tx = await createAndSignTransaction(env,
        [ ix ],
        [ ]
    );

    return sendAndConfirm(env, tx);
}

export async function closeAccounts(env: TestEnv): Promise<String> {
    // The close authority decides it would like to collect back the timelock
    // rent. This zero's out the account data but requires that the timelock
    // token balance be zero. 

    const ix = await env.program.methods.closeAccounts(
        env.timelockBump,
    ).accounts({
        timelock: env.timelock,                     // timelock state
        vault: env.vault,                           // timelock vault
        closeAuthority: env.payer.publicKey,        // who has close authority
        payer: env.payer.publicKey,                 // who pays the SOL fee for the transaction 
        tokenProgram: TOKEN_PROGRAM_ID,             // SPL token program
        systemProgram: SystemProgram.programId,     // system program
    }).instruction();

    const tx = await createAndSignTransaction(env,
        [ ix ],
        [ ]
    );

    return sendAndConfirm(env, tx);
}

async function sendAndConfirm(env: TestEnv, tx: Result): Promise<String> {
    await sendAndConfirmRawTransaction(env.provider.connection, tx.rawTx, {
        skipPreflight: false,
        commitment: "recent",
    });

    return tx.signatures[0];
}

export async function getTimelockAccount(env: TestEnv, address: string): Promise<String> {
    await api_wait();
    const timelock = await env.program.account.timeLockAccount.fetch(address);
    const res = JSON.stringify(timelock);

    console.log(`\t timelock:\n ${res}`);

    return res;
}