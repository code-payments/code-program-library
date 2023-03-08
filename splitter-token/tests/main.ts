import * as anchor from "@project-serum/anchor";
import * as happy_path from "./cases/happy-path";

import { setEnvironment } from "./utils/config";

setEnvironment();

describe("timelock-token", () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);

  it("tests the happy path", async () => {
    await happy_path.test_create_pool(provider);
    await happy_path.test_blind_transfer(provider);
    await happy_path.test_create_proof_of_payment(provider);
    await happy_path.test_create_conditional_token_account(provider);
    await happy_path.test_split_payment(provider);
  });


});
