import { AnchorProvider } from "@project-serum/anchor";
import { assert } from "chai";
import { newTestEnv } from './env';
import * as test from "../utils/timelock-instructions";
import * as spl from "../utils/spl-instructions";

export async function test_revoke_with_authority(provider: AnchorProvider) {
    console.log("test_revoke_with_authority");

    const env = await newTestEnv(provider);

    // This should succeed. 

    try {
        await test.createTimelock(env);
        await spl.depositToTimelock(env, 100); // tokens
        await test.revokeWithAuthority(env);

    } catch(e) {
        console.log(e)
        assert.ok(false);
    }
}

export async function test_withdraw_after_unlock(provider: AnchorProvider) {
    console.log("test_withdraw_after_unlock");

    const env = await newTestEnv(provider);

    // This should succeed. 

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

export async function test_relock_after_unlock(provider: AnchorProvider) {
    console.log("test_relock_after_unlock");

    const env = await newTestEnv(provider);

    // This should succeed. 

    try {
        await test.createTimelock(env);
        await spl.depositToTimelock(env, 100); // tokens
        await test.revokeWithAuthority(env);
        await test.deactivateTimelock(env);
        await test.withdrawFromTimelock(env);
        await test.activateTimelock(env);

    } catch(e) {
        console.log(e)
        assert.ok(false);
    }
}
