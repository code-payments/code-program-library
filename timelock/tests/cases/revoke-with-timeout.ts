import { AnchorProvider } from "@project-serum/anchor";
import { assert } from "chai";
import * as test from "../utils/timelock-instructions";
import * as spl from "../utils/spl-instructions";
import { newTestEnv } from "./env";
import { sleep } from "../utils/wait";

export async function test_revoke_with_timeout(provider: AnchorProvider) {
    console.log("test_revoke_with_timeout");

    const env = await newTestEnv(provider);

    // This should succeed. 

    try {
        await test.createTimelock(env);
        await spl.depositToTimelock(env, 100); // tokens
        await test.revokeWithTimeout(env);

    } catch(e) {
        console.log(e)
        assert.ok(false);
    }
}

export async function test_transfer_while_in_wait_period(provider: AnchorProvider) {
    console.log("test_transfer_while_in_wait_period");

    const env = await newTestEnv(provider);

    // This should succeed. 

    try {
        await test.createTimelock(env);
        await spl.depositToTimelock(env, 100); // tokens
        await test.revokeWithTimeout(env);
        await test.transferWithAuthority(env, 5) // tokens

    } catch(e) {
        console.log(e)
        assert.ok(false);
    }
}

export async function test_wait_period(provider: AnchorProvider) {
    console.log("test_wait_period");

    const env = await newTestEnv(provider);

    // This should fail. 

    try {
        await test.createTimelock(env);
        await spl.depositToTimelock(env, 100); // tokens
        await test.revokeWithTimeout(env);

        // no sleep here

        await test.deactivateTimelock(env);
        await test.withdrawFromTimelock(env);

        assert.ok(false);
    } catch(e) {
        const err = JSON.stringify(e);
        assert.ok(err.includes('Error Number: 6003'));
        assert.ok(err.includes('Error Code: InsufficientTimeElapsed'));
    }
}
