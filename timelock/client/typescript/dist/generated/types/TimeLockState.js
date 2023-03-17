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
exports.timeLockStateBeet = exports.TimeLockState = void 0;
var beet = __importStar(require("@metaplex-foundation/beet"));
/**
 * @category enums
 * @category generated
 */
var TimeLockState;
(function (TimeLockState) {
    TimeLockState[TimeLockState["Unknown"] = 0] = "Unknown";
    TimeLockState[TimeLockState["Unlocked"] = 1] = "Unlocked";
    TimeLockState[TimeLockState["WaitingForTimeout"] = 2] = "WaitingForTimeout";
    TimeLockState[TimeLockState["Locked"] = 3] = "Locked";
    TimeLockState[TimeLockState["Closed"] = 4] = "Closed";
})(TimeLockState = exports.TimeLockState || (exports.TimeLockState = {}));
/**
 * @category userTypes
 * @category generated
 */
exports.timeLockStateBeet = beet.fixedScalarEnum(TimeLockState);