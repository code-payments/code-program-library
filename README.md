# Code Program Library
The Code Program Library is a collection of on-chain programs targeting the
Solana Sealevel runtime. These programs include clients to interact with the
on-chain programs. The programs are deployed to the Mainnet-Beta cluster. We
will graciously accept patches to ensure the programs here are secure and
reliable but ask that you submit any security concerns privately by emailing
secury@getcode.com.

## Audits

| Program | Last Audit Date | Audit Report | Version |
| --- | --- | --- | --- |
| [timelock-token](https://github.com/code-wallet/code-program-library/tree/main/timelock-token) | Pending (OtterSec) | Pending | v0.1.0 |
| [splitter-token](https://github.com/code-wallet/code-program-library/tree/main/splitter-token) | Pending (OtterSec) | Pending | v0.1.0 |

## Quickstart

The programs in this repository are built using the
[Anchor](https://www.anchor-lang.com/) framework. Anchor is a framework for
building on-chain programs for the Solana blockchain. It provides a convenient
Rust macros for declaring program instructions and a client library for
interacting with the on-chain programs.

If you have any issues building the programs, please refer to the [Anchor
documentation](https://www.anchor-lang.com/docs/installation).

#### Program Clients

In order to interact with the on-chain programs, we provide clients for each of
the programs. These clients are generated from the IDL.

The clients are available in the following languages:

* A `TypeScript` client for use in the browser or Node.js
* A `Go` client derived from the TypeScript client
* The `IDL` for use with Anchor's client library or other clients

The `TypeScript` client is generated from the IDL using solita. You are able to do
this as well by running `npm run build` in the client directory. 

The `Go` client is derived from this by hand. There are tools to automate this
process, but we chose to limit the dependencies of the Go client and therefore
have a manual process at the moment. 

We will be adding more clients in the future. Pull requests are welcome.


#### Environment Setup

1. Install the latest [Solana tools](https://docs.solana.com/cli/install-solana-cli-tools).
2. Install the latest [Rust stable](https://rustup.rs/). If you already have Rust, run `rustup update` to get the latest version.
3. Install the `anchor` development environment.

The lastest tested versions used to build the programs are:

```bash
> rustup --version
rustup 1.25.2 (17db695f1 2023-02-01)
info: This is the version for the rustup toolchain manager, not the rustc compiler.
info: The currently active `rustc` version is `rustc 1.67.1 (d5a82bbd2 2023-02-07)`

> rustc --version
rustc 1.67.1 (d5a82bbd2 2023-02-07)

> solana --version
solana-cli 1.15.2 (src:dea65f48; feat:1211687720, client:SolanaLabs)

> anchor --version
anchor-cli 0.24.2
```

#### Build on-chain programs

```bash
# To build a specific on-chain program
$ cd <program_name>/
$ anchor build
```

#### Build clients

```bash
# To build a specific client
$ cd <program_name>/client/<client_name>/
$ npm run build
```

#### Testing

We use more extensive tests internally. This repository only contains limited
tests that and can be found in the `tests` directory. You're welcome to run
these tests, but they are not exhaustive. We will be adding more tests in the
future. Pull requests are welcome.

## Legal Disclaimer

DISCLAIMER OF WARRANTY: The programs are provided on an "as is" basis without any warranties of any kind, either express or implied including without limitation warranties of merchantability, fitness for a particular purpose, or non-infringement. CODE INC. DISCLAIM ALL WARRANTIES INCLUDING WITHOUT LIMITATION ANY WARRANTIES OF ACCURACY, COMPLETENESS, RELIABILITY, OR SUITABILITY. IN NO EVENT SHALL CODE INC. BE LIABLE FOR ANY DAMAGES INCLUDING WITHOUT LIMITATION DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR SIMILAR DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING OUT OF THE USE OR INABILITY TO USE THE CODE PROGRAM LIBRARY OR FOR ANY OTHER CLAIM BY THE USER OR ANY OTHER PARTY.

LIMITATION OF LIABILITY: THE USER ASSUMES ALL RISKS AND RESPONSIBILITIES WHEN USING THE CODE PROGRAM LIBRARY. CODE INC. CANNOT BE HELD RESPONSIBLE FOR ANY DAMAGES OR LOSSES INCURRED FROM THE USE OF THE CODE PROGRAM LIBRARY. THE USER IS SOLELY RESPONSIBLE FOR ENSURING THE SECURITY OF THEIR ACCESS KEY AND FUNDS. THE CODE PROGRAM LIBRARY IS PROVIDED AS AN EXAMPLE IMPLEMENTATION ONLY AND IS NOT INTENDED FOR PRODUCTION USE. CODE INC. AND THE DEVELOPMENT TEAM SHALL HAVE NO LIABILITY FOR ANY ERRORS, OMISSIONS, OR INACCURACIES IN THE INFORMATION PROVIDED.

Please view the full Terms of Use at https://www.getcode.com/terms.

## Security and Issue Disclosures

In the interest of protecting the security of our users and their funds, we ask
that if you discover any security vulnerabilities in the Code Program Library,
the on-chain smart contract, or the mobile app, please report them use this
[Report a Vulnerability](https://github.com/code-wallet/code-program-library/security/advisories/new)
link. Our security team will review your report. Your cooperation in maintaining
the security of our products is appreciated.

Please view the full [Security Policy](https://github.com/code-wallet/code-program-library/blob/main/SECURITY.md).
