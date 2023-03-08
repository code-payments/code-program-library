import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import {
    sendAndConfirmRawTransaction,
} from "@solana/web3.js";
import { TestEnv } from "./test-env";
import { createAndSignTransaction } from "./transaction";

export async function depositToTimelock(env: TestEnv, amount: number): Promise<string> {
    // Move <amount> tokens to the vault using a standard SPL token transfer
    // instruction.

    const ix = Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,            // program id
        env.alice.token,             // source
        env.vault,                   // destination
        env.alice.keypair.publicKey, // owner
        [],
        amount,                      // amount
    )

    const tx = await createAndSignTransaction(env,
        [ ix ],
        [ env.alice.keypair ]
    );

    const sig = await sendAndConfirmRawTransaction(env.provider.connection, tx.rawTx, {
        skipPreflight: false,
        commitment: "confirmed",
    });

    return sig
}
