"use strict";
/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */
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
exports.merkleTreeBeet = void 0;
var beet = __importStar(require("@metaplex-foundation/beet"));
/**
 * @category userTypes
 * @category generated
 */
exports.merkleTreeBeet = new beet.FixableBeetArgsStruct([
    ['levels', beet.u8],
    ['nextIndex', beet.u64],
    ['root', beet.uniformFixedSizeArray(beet.u8, 32)],
    ['filledSubtrees', beet.array(beet.uniformFixedSizeArray(beet.u8, 32))],
    ['zeroValues', beet.array(beet.uniformFixedSizeArray(beet.u8, 32))],
], 'MerkleTree');