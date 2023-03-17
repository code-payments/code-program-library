import { AnchorProvider } from "@project-serum/anchor";
import { assert } from "chai";
import { newTestEnv } from './env';
import * as test from "../utils/timelock-instructions";
import * as spl from "../utils/spl-instructions";

export async function test_create_timelock(provider: AnchorProvider) {
    console.log("test_create_timelock");

    const env = await newTestEnv(provider);

    // This should succeed.

    try {
        await test.createTimelock(env);
    } catch(e) {
        console.log(e)
        assert.ok(false);
    }

    // TODO: validate the data.
    // await test.getTimelockAccount(env, env.timelock.toBase58());
}

export async function test_close_account(provider: AnchorProvider) {
    console.log("test_close_account");

    const env = await newTestEnv(provider);

    // This should succeed. 

    try {
        await test.createTimelock(env);
        await test.closeAccounts(env);

    } catch(e) {
        console.log(e)
        assert.ok(false);
    }
}

export async function test_unlock_and_withdraw(provider: AnchorProvider) {
    console.log("test_unlock_and_withdraw");

    const env = await newTestEnv(provider);

    // Simple create to transfer.

    try {
        await test.createTimelock(env);
        await spl.depositToTimelock(env, 100); // tokens

        await test.revokeWithAuthority(env);
        await test.deactivateTimelock(env);

        await test.withdrawFromTimelock(env);

    } catch(e) {
        console.log(e)
        assert.ok(false);
    }
}

export async function test_relock(provider: AnchorProvider) {
    console.log("test_relock");

    const env = await newTestEnv(provider);

    // Simple create to transfer.

    try {
        await test.createTimelock(env);
        await spl.depositToTimelock(env, 100); // tokens

        await test.revokeWithAuthority(env);
        await test.deactivateTimelock(env);
        await test.activateTimelock(env);

        await test.transferWithAuthority(env, 5); // tokens

    } catch(e) {
        console.log(e)
        assert.ok(false);
    }
}

export async function test_happy_path(provider: AnchorProvider) {
    console.log("test_happy_path");

    const env = await newTestEnv(provider);

    // Simple create to transfer.

    try {
        await test.createTimelock(env);
        await spl.depositToTimelock(env, 100); // tokens

        await test.transferWithAuthority(env, 10); // tokens
        await test.transferWithAuthority(env, 23); // tokens
        await test.transferWithAuthority(env, 65); // tokens

        // Get rid of the rest.
        await test.burnDustWithAuthority(env, 10); // Burn anything remaining, up to 10 tokens (exactly 2 in this case).

        // Close all accounts and collect rent.
        await test.closeAccounts(env); // balance must be 0

    } catch(e) {
        console.log(e)
        assert.ok(false);
    }
}
