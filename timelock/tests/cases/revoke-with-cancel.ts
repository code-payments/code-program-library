import { AnchorProvider } from "@project-serum/anchor";
import { assert } from "chai";
import { newTestEnv } from './env';
import * as test from "../utils/timelock-instructions";
import * as spl from "../utils/spl-instructions";

export async function test_cancel_wait_period(provider: AnchorProvider) {
    console.log("test_cancel_wait_period");

    const env = await newTestEnv(provider);

    // This should succeed. 

    try {
        await test.createTimelock(env);
        await spl.depositToTimelock(env, 100); // tokens
        await test.revokeWithTimeout(env);
        await test.cancelTimeout(env);

        // no sleep here

        await test.deactivateTimelock(env);
        await test.withdrawFromTimelock(env);

    } catch(e) {
        console.log(e)
        assert.ok(false);
    }
}
