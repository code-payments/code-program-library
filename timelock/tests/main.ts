import * as anchor from "@project-serum/anchor";

import * as happy_path from "./cases/happy-path";
import * as edge_cases from "./cases/edge-cases";
import * as revoke_with_authority from "./cases/revoke-with-authority";
import * as revoke_with_timeout from "./cases/revoke-with-timeout";
import * as revoke_with_cancel from "./cases/revoke-with-cancel";

import { setEnvironment } from "./utils/config";

setEnvironment();

describe("timelock", () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);

  it("tests the happy path", async () => {
    await happy_path.test_create_timelock(provider);
    await happy_path.test_close_account(provider);
    await happy_path.test_unlock_and_withdraw(provider);
    await happy_path.test_relock(provider);
    await happy_path.test_happy_path(provider);
  });

  it("tests the edge cases", async () => {
    await edge_cases.test_transfer_before_lock(provider);
    await edge_cases.test_withdraw_with_no_funds(provider);
    await edge_cases.test_withdraw_before_unlock(provider);
    await edge_cases.test_withdraw_with_no_funds(provider);
  });

  it("tests the revoke with time authority cases", async () => {
    await revoke_with_authority.test_revoke_with_authority(provider);
    await revoke_with_authority.test_relock_after_unlock(provider);
    await revoke_with_authority.test_withdraw_after_unlock(provider);
  });

  it("tests the revoke with timeout cases", async () => {
    await revoke_with_timeout.test_revoke_with_timeout(provider);
    await revoke_with_timeout.test_transfer_while_in_wait_period(provider);
    await revoke_with_timeout.test_wait_period(provider);
  });

  it("tests the revoke with cancel cases", async () => {
    await revoke_with_cancel.test_cancel_wait_period(provider);
  });

});
