import { AnchorProvider } from "@project-serum/anchor";
import { assert } from "chai";
import { newTestEnv } from './env';
import * as test from "../utils/timelock-instructions";
import * as spl from "../utils/spl-instructions";

export async function test_transfer_before_lock(provider: AnchorProvider) {
    console.log("test_transfer_before_lock");

    const env = await newTestEnv(provider);

    // This should fail because the account is not locked. 

    try {
        await test.createTimelock(env);
        await spl.depositToTimelock(env, 100); // tokens
        await test.revokeWithAuthority(env);;
        await test.deactivateTimelock(env);
        await test.transferWithAuthority(env, 20); // tokens

        assert.ok(false);
    } catch(e) {
        const err = JSON.stringify(e);
        assert.ok(err.includes('Error Number: 6000'));
        assert.ok(err.includes('Error Code: InvalidTimeLockState'));
    }
}

export async function test_withdraw_with_no_funds(provider: AnchorProvider) {
    console.log("test_withdraw_with_no_funds");

    const env = await newTestEnv(provider);

    // This should NOT fail because the timelock account is empty. 

    try {
        await test.createTimelock(env);

        await test.revokeWithAuthority(env);;
        await test.deactivateTimelock(env);
        await test.withdrawFromTimelock(env);

    } catch(e) {
        console.log(e)
        assert.ok(false);
    }
}

export async function test_withdraw_before_unlock(provider: AnchorProvider) {
    const env = await newTestEnv(provider);

    // This should fail because the account is locked. 

    try {
        await test.createTimelock(env);
        await spl.depositToTimelock(env, 100); // tokens
        await test.withdrawFromTimelock(env);

        assert.ok(false);
    } catch(e) {
        const err = JSON.stringify(e);
        assert.ok(err.includes('Error Number: 6000'));
        assert.ok(err.includes('Error Code: InvalidTimeLockState'));
    }
}

export async function test_close_account_with_balance(provider: AnchorProvider) {
    console.log("test_close_account_with_balance");

    const env = await newTestEnv(provider);

    // This should succeed. 

    try {
        await test.createTimelock(env);
        await spl.depositToTimelock(env, 100); // tokens
        await test.closeAccounts(env);

        assert.ok(false);
    } catch(e) {
        const err = JSON.stringify(e);
        assert.ok(err.includes('Error Number: 6008'));
        assert.ok(err.includes('Error Code: NonZeroTokenBalance'));
    }
}