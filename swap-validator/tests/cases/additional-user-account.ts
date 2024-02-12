import { AnchorProvider } from "@project-serum/anchor";
import { assert } from "chai";
import { newTestEnv } from './env';
import * as test from "../utils/transaction";

export async function test_additional_user_account(provider: AnchorProvider) {
    console.log("test_additional_user_account");

    const env = await newTestEnv(provider);

    try {
        await test.swap(env, 1, 10, 1, 10, false, false, true);
    } catch(e) {
        console.log(e)
        return
    }

    assert.ok(false);
}
