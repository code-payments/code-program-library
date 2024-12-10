import { AnchorProvider } from "@project-serum/anchor";
import { assert } from "chai";
import { newTestEnv } from './env';
import * as test from "../utils/transaction";

export async function test_source_account_updated(provider: AnchorProvider) {
    console.log("test_source_account_updated");

    const env = await newTestEnv(provider);

    try {
        await test.swap(env, 1, 10, 1, 10, true, false);
    } catch(e) {
        console.log(e)
        return
    }

    assert.ok(false);
}

export async function test_destination_account_updated(provider: AnchorProvider) {
    console.log("test_destination_account_updated");

    const env = await newTestEnv(provider);

    try {
        await test.swap(env, 1, 10, 1, 10, false, true);
    } catch(e) {
        console.log(e)
        return
    }

    assert.ok(false);
}