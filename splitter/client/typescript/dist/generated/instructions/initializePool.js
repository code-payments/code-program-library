"use strict";
/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
exports.__esModule = true;
exports.createInitializePoolInstruction = void 0;
var splToken = __importStar(require("@solana/spl-token"));
var beet = __importStar(require("@metaplex-foundation/beet"));
var web3 = __importStar(require("@solana/web3.js"));
/**
 * @category Instructions
 * @category InitializePool
 * @category generated
 */
var initializePoolStruct = new beet.FixableBeetArgsStruct([
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['name', beet.utf8String],
    ['levels', beet.u8],
], 'InitializePoolInstructionArgs');
var initializePoolInstructionDiscriminator = [
    95, 180, 10, 172, 84, 174, 232, 40,
];
/**
 * Creates a _InitializePool_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category InitializePool
 * @category generated
 */
function createInitializePoolInstruction(accounts, args) {
    var pool = accounts.pool, vault = accounts.vault, mint = accounts.mint, authority = accounts.authority, payer = accounts.payer;
    var data = initializePoolStruct.serialize(__assign({ instructionDiscriminator: initializePoolInstructionDiscriminator }, args))[0];
    var keys = [
        {
            pubkey: pool,
            isWritable: true,
            isSigner: false
        },
        {
            pubkey: vault,
            isWritable: true,
            isSigner: false
        },
        {
            pubkey: mint,
            isWritable: false,
            isSigner: false
        },
        {
            pubkey: authority,
            isWritable: false,
            isSigner: true
        },
        {
            pubkey: payer,
            isWritable: true,
            isSigner: true
        },
        {
            pubkey: splToken.TOKEN_PROGRAM_ID,
            isWritable: false,
            isSigner: false
        },
        {
            pubkey: web3.SystemProgram.programId,
            isWritable: false,
            isSigner: false
        },
        {
            pubkey: web3.SYSVAR_RENT_PUBKEY,
            isWritable: false,
            isSigner: false
        },
    ];
    var ix = new web3.TransactionInstruction({
        programId: new web3.PublicKey('spLit2eb13Tz93if6aJM136nUWki5PVUsoEjcUjwpwW'),
        keys: keys,
        data: data
    });
    return ix;
}
exports.createInitializePoolInstruction = createInitializePoolInstruction;
