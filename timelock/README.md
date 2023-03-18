# Timelock Program

[![Crates.io](https://img.shields.io/crates/v/timelock)](https://crates.io/crates/timelock)
[![License](https://img.shields.io/crates/l/timelock)](https://github.com/code-wallet/code-program-library/blob/main/timelock/LICENSE.txt)
[![Build Status](https://img.shields.io/github/workflow/status/code-wallet/code-program-library/Rust/main)](https://github.com/code-wallet/code-program-library/actions/workflows/rust.yml?query=branch%3Amain)
[![Contributors](https://img.shields.io/github/contributors/code-wallet/code-program-library)](https://github.com/code-wallet/code-program-library/graphs/contributors)

<img src="/timelock/docs/timelock-banner.png?raw=true">

## Overview 

The Timelock program enables simple state-channel mechanics on Solana, as
described in detail by
[Vitalik](https://vitalik.ca/general/2021/01/05/rollup.html) and [Jeff
Coleman](https://www.jeffcoleman.ca/state-channels/). It's specifically designed
to be used with the [Code App](http://getcode.com). 

When combined with durable nonces, the Timelock program provides non-custodial
guarantees of fund availability. This feature has practical uses in various
areas, including applications that require instant off-chain transactions.

To view or unlock timelock accounts created by the Code App or other
applications, you can use the
[Timelock Explorer](https://code-wallet.github.io/timelock-explorer/).

## On-chain Program

The Timelock program is deployed to Solana mainnet-beta at the following address:

[time2Z2SCnn3qYg3ULKVtdkh8YmZ5jFdKicnA1W2YnJ](https://explorer.solana.com/address/time2Z2SCnn3qYg3ULKVtdkh8YmZ5jFdKicnA1W2YnJ)

### Example Use Case

Imagine that Alice owns a vending machine business with some machines in remote
locations that have limited network connectivity. The machines sell snacks for 1
USDC each, and Bob wants to buy several snacks without waiting for each payment
to finalize.

However, poor connectivity may cause transactions to take a long time to
confirm. To solve this problem, Alice uses the Timelock smart contract on her
machines. Before buying snacks, Bob creates an associated Timelock account and
deposits 20 USDC. Once this is confirmed on-chain, Alice gives him a smart card
with a balance of $20.

Bob can make purchases until he runs out of money on his smart card. Each time
Bob interacts with a vending machine, the balance on his smart card is updated,
and his smart card signs for the purchase. The on-chain balance may not be
updated until the vending machine has network connectivity.

When Bob finishes purchasing snacks, Alice can co-sign to transfer the remaining
balance on his smart card to him without delay. If Alice is unavailable or
unwilling, Bob can initiate an unlock process by requesting an unlock on-chain.
This requires Bob to wait the agreed-upon timeout, such as 7 days, that he chose
when creating his account. Once the timeout elapses, he can withdraw his funds
without Alice's help.

In the example above, Bob's smart card is a Timelock token account with Alice
declared as the time authority. The vending machine uses the Timelock program to
establish a state channel. When combined with durable nonces, the vending
machine can wait until it has network connectivity and issue pre-authorized
transactions later with the guarantee that the funds are still available. The
purchase can be instant and does not depend on network availability in the
moment, making it perfect for a vending machine with intermittent internet
connection.

Alice can watch the account for state changes and have enough time to respond to
an unlock request. However, only Bob can initiate any transfer from his account.
Alice can control how long the transfer takes by being the time authority, but
she cannot steal Bob's money. Bob remains the owner of his funds, and Alice does
not have custody of them.

## State Machine

<img src="/timelock/docs/timelock-token.png?raw=true">

## Quickstart

### Standard tooling (vanilla anchor) 

Run the following commands to run a local validator and execute the tests.

```
yarn install
anchor build
npm build
anchor test
```

### Metaplex tooling (better)

Run the test validator with the following commands

```bash
yarn install
anchor build
npm run build
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
