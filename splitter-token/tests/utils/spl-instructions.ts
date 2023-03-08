import { PublicKey, Transaction, } from "@solana/web3.js";
import { TestEnv, TestUser } from "./test-env";
import { createAndSignTransaction, Result, sendAndConfirm } from "../utils/transaction";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export async function createTransfer(
    env: TestEnv,
    source: TestUser,
    destination: PublicKey,
    amount: number,
): Promise<Result> {

    const ix = [
        Token.createTransferInstruction(
            TOKEN_PROGRAM_ID,
            source.token,
            destination,
            source.keypair.publicKey,
            [],
            amount),
    ]

    return await createAndSignTransaction(env,
        [...ix],
        [source.keypair]
    );
}
