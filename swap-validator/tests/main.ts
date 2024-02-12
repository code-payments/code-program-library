import * as anchor from "@coral-xyz/anchor";

import * as happy_path from "./cases/happy-path";
import * as additional_user_account from "./cases/additional-user-account";
import * as invalid_swap_amount from "./cases/invalid-swap-amount";
import * as token_account_update from "./cases/token-account-update";

describe("swap-validator", () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);

  it("tests the happy path", async () => {
    await happy_path.test_swap_exact_amount(provider)
    await happy_path.test_send_less_than_expected(provider)
    await happy_path.test_receive_more_than_expected(provider)
  });

  it("tests invalid swapped amount", async () => {
    await invalid_swap_amount.test_send_too_many(provider)
    await invalid_swap_amount.test_receive_too_little(provider)
  });

  it("tests token account update", async () => {
    await token_account_update.test_source_account_updated(provider)
    await token_account_update.test_destination_account_updated(provider)
  });

  it("tests additional user account", async () => {
    await additional_user_account.test_additional_user_account(provider)
  });
});
