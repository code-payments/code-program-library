import { AnchorProvider } from "@project-serum/anchor";
import { assert } from "chai";
import { newTestEnv } from './env';
import * as test from "../utils/transaction";

export async function test_swap_exact_amount(provider: AnchorProvider) {
    console.log("test_swap_exact_amount");

    const env = await newTestEnv(provider);

    try {
        await test.swap(env, 1, 10, 1, 10);
    } catch(e) {
        console.log(e)
        assert.ok(false);
    }
}

export async function test_send_less_than_expected(provider: AnchorProvider) {
    console.log("test_send_less_than_expected");

    const env = await newTestEnv(provider);

    try {
        await test.swap(env, 1, 10, 2, 10);
    } catch(e) {
        console.log(e)
        assert.ok(false);
    }
}

export async function test_receive_more_than_expected(provider: AnchorProvider) {
    console.log("test_receive_more_than_expected");

    const env = await newTestEnv(provider);

    try {
        await test.swap(env, 1, 100, 1, 10);
    } catch(e) {
        console.log(e)
        assert.ok(false);
    }
}
