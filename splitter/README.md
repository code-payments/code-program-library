# Splitter Program

[![Crates.io](https://img.shields.io/crates/v/splitter)](https://crates.io/crates/splitter)
[![License](https://img.shields.io/crates/l/splitter)](https://github.com/code-wallet/code-program-library/blob/main/splitter/LICENSE.txt)
[![Build Status](https://img.shields.io/github/workflow/status/code-wallet/code-program-library/Rust/main)](https://github.com/code-wallet/code-program-library/actions/workflows/rust.yml?query=branch%3Amain)
[![Contributors](https://img.shields.io/github/contributors/code-wallet/code-program-library)](https://github.com/code-wallet/code-program-library/graphs/contributors)

<img src="/splitter/docs/splitter-banner.png?raw=true">

## Overview

Tokens are typically transferred atomically from source to destination in a
single instruction. However, there are cases where it may be useful to split
a transfer into two separate transfers. However, if not done properly, this
could violate the non-custodial nature of the original transfer.

To address this, the Splitter program enables users to split token
transfers into two instructions while preserving the non-custodial nature of the
transfer. The program allows anyone to create a treasury account that can be
used to split transfers. The treasury account is owned by a trusted party who
can approve the transfer.

The Splitter program gets its name from the fact that it splits a single
transfer into two parts, one from the program to the destination, and one from
the source to the program, where the amount itself does not change.

## On-chain Program

The Splitter program is deployed to Solana mainnet-beta at the following address:

[spLit2eb13Tz93if6aJM136nUWki5PVUsoEjcUjwpwW](https://explorer.solana.com/address/spLit2eb13Tz93if6aJM136nUWki5PVUsoEjcUjwpwW)

### Example Use Case

Assuming that Alice wants to transfer 100 tokens to Bob, normally this can be
done by sending a single transfer instruction from Alice to Bob. However, in
some cases, it may be beneficial to split the transfer into two parts. For
instance, if Alice and Bob wish to use a common third party for the exchange
instead of a direct transfer. In such cases, Alice can transfer 100 tokens to
the third party, and the third party can then transfer 100 tokens to Bob. This
is a two-step process, and in this case the third party acts as a custodian of
the funds.

To make the process non-custodial, we need to ensure that the third party does
not have any means of stealing the funds. The Splitter program has been created
to help in this regard. The third party can create a treasury account that can
be used to split the transfer into two parts without being a custodian of the
transfer amount.

The high-level process is as follows:

1) The third party creates a Splitter treasury account and deposits at least 100
tokens into it.

2) Alice provides the third party with a signed transfer instruction from Alice
to the Splitter treasury for 100 tokens. This transfer is computationally
conditional on a future proof-of-payment provided by the Splitter program, that
the third party treasury has sent Bob the same amount (100 tokens). The third
party puts this signed transfer transaction aside for later, and it is not yet
submitted to the blockchain.

    Note: This is done indirectly through a token account that doesn't yet exist
    but its address can be calculated ahead of time. The token account can only
    be opened by using a verified merkle proof.

3) The third party can now send Bob 100 tokens from its splitter treasury
account after validating that Alice has 100 tokens in her account and that the
transaction it received earlier is valid. This will cause the Splitter program
to write a proof-of-payment into a merkle tree.

    Note: Timelock accounts and durable nonces are useful here to ensure that Alice
    cannot move her tokens before the third party is able to get them.

4) With the condition now being met, the third party then submits the signed
transfer transaction from Alice to the Splitter treasury account.

5) The third party can now withdraw the 100 tokens from the treasury account.

The key innovation of the Splitter program is that both transfers can be signed
at the same time without waiting for confirmation on-chain. If the condition of
the destination being paid first is not met, then the source cannot not be
debited. It is in the best interest of the third party to pay the destination
before executing the conditional payment, as failure to do so would result in a
loss of funds.

It is important to note that the third party managing the treasury account has
no control over the transfer other than to approve it. This design ensures that
the non-custodial assumptions of the original transfer are not broken. 

The program is designed to be used with the [Timelock
Program](/timelock/README.md). However, the program does not require the
use of the Timelock Program.

## Quickstart

### Standard tooling (vanilla anchor) 

Run the following commands to run a local validator and execute the tests.

```
yarn install
anchor build
npm run gen:typescript
anchor test
```

### Metaplex tooling (better)

Run the test validator with the following commands

```bash
yarn install
anchor build
npm run gen:typescript
yarn run amman:start
```

Then in another terminal window, run the following:

```bash
yarn run test
```

You can now navigate to the following page: [https://amman-explorer.metaplex.com/](https://amman-explorer.metaplex.com/)

## Legal Disclaimer

DISCLAIMER OF WARRANTY: The programs are provided on an "as is" basis without any warranties of any kind, either express or implied including without limitation warranties of merchantability, fitness for a particular purpose, or non-infringement. CODE INC. DISCLAIM ALL WARRANTIES INCLUDING WITHOUT LIMITATION ANY WARRANTIES OF ACCURACY, COMPLETENESS, RELIABILITY, OR SUITABILITY. IN NO EVENT SHALL CODE INC. BE LIABLE FOR ANY DAMAGES INCLUDING WITHOUT LIMITATION DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR SIMILAR DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING OUT OF THE USE OR INABILITY TO USE THE CODE PROGRAM LIBRARY OR FOR ANY OTHER CLAIM BY THE USER OR ANY OTHER PARTY.

LIMITATION OF LIABILITY: THE USER ASSUMES ALL RISKS AND RESPONSIBILITIES WHEN USING THE CODE PROGRAM LIBRARY. CODE INC. CANNOT BE HELD RESPONSIBLE FOR ANY DAMAGES OR LOSSES INCURRED FROM THE USE OF THE CODE PROGRAM LIBRARY. THE USER IS SOLELY RESPONSIBLE FOR ENSURING THE SECURITY OF THEIR ACCESS KEY AND FUNDS. THE CODE PROGRAM LIBRARY IS PROVIDED AS AN EXAMPLE IMPLEMENTATION ONLY AND IS NOT INTENDED FOR PRODUCTION USE. CODE INC. AND THE DEVELOPMENT TEAM SHALL HAVE NO LIABILITY FOR ANY ERRORS, OMISSIONS, OR INACCURACIES IN THE INFORMATION PROVIDED.

Please view the full Terms of Use at https://www.getcode.com/terms.

## Security Issues and Disclosures

In the interest of protecting the security of our users and their funds, we ask that if you discover any security vulnerabilities in the Code Program Library, the clients, the on-chain smart contracts, or the mobile app, you report them directly to security@getcode.com. Our security team will review your report. Your cooperation in maintaining the security of our products is appreciated.

Please view the full Security Policy at https://www.getcode.com/security.
