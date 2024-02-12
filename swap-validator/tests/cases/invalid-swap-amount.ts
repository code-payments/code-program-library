import { AnchorProvider } from "@project-serum/anchor";
import { assert } from "chai";
import { newTestEnv } from './env';
import * as test from "../utils/transaction";

export async function test_send_too_many(provider: AnchorProvider) {
    console.log("test_send_too_many");

    const env = await newTestEnv(provider);

    try {
        await test.swap(env, 2, 10, 1, 10);
    } catch(e) {
        console.log(e)
        return
    }

    assert.ok(false);
}

export async function test_receive_too_little(provider: AnchorProvider) {
    console.log("test_receive_too_little");

    const env = await newTestEnv(provider);

    try {
        await test.swap(env, 1, 5, 1, 10);
    } catch(e) {
        console.log(e)
        return
    }

    assert.ok(false);
}