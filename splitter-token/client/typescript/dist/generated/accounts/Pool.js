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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.poolBeet = exports.Pool = void 0;
var beetSolana = __importStar(require("@metaplex-foundation/beet-solana"));
var beet = __importStar(require("@metaplex-foundation/beet"));
var DataVersion_1 = require("../types/DataVersion");
var MerkleTree_1 = require("../types/MerkleTree");
var poolDiscriminator = [241, 154, 109, 4, 17, 177, 109, 188];
/**
 * Holds the data for the {@link Pool} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
var Pool = /** @class */ (function () {
    function Pool(dataVersion, authority, mint, vault, vaultBump, name, historyList, currentIndex, merkleTree) {
        this.dataVersion = dataVersion;
        this.authority = authority;
        this.mint = mint;
        this.vault = vault;
        this.vaultBump = vaultBump;
        this.name = name;
        this.historyList = historyList;
        this.currentIndex = currentIndex;
        this.merkleTree = merkleTree;
    }
    /**
     * Creates a {@link Pool} instance from the provided args.
     */
    Pool.fromArgs = function (args) {
        return new Pool(args.dataVersion, args.authority, args.mint, args.vault, args.vaultBump, args.name, args.historyList, args.currentIndex, args.merkleTree);
    };
    /**
     * Deserializes the {@link Pool} from the data of the provided {@link web3.AccountInfo}.
     * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
     */
    Pool.fromAccountInfo = function (accountInfo, offset) {
        if (offset === void 0) { offset = 0; }
        return Pool.deserialize(accountInfo.data, offset);
    };
    /**
     * Retrieves the account info from the provided address and deserializes
     * the {@link Pool} from its data.
     *
     * @throws Error if no account info is found at the address or if deserialization fails
     */
    Pool.fromAccountAddress = function (connection, address) {
        return __awaiter(this, void 0, void 0, function () {
            var accountInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, connection.getAccountInfo(address)];
                    case 1:
                        accountInfo = _a.sent();
                        if (accountInfo == null) {
                            throw new Error("Unable to find Pool account at ".concat(address));
                        }
                        return [2 /*return*/, Pool.fromAccountInfo(accountInfo, 0)[0]];
                }
            });
        });
    };
    /**
     * Deserializes the {@link Pool} from the provided data Buffer.
     * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
     */
    Pool.deserialize = function (buf, offset) {
        if (offset === void 0) { offset = 0; }
        return exports.poolBeet.deserialize(buf, offset);
    };
    /**
     * Serializes the {@link Pool} into a Buffer.
     * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
     */
    Pool.prototype.serialize = function () {
        return exports.poolBeet.serialize(__assign({ accountDiscriminator: poolDiscriminator }, this));
    };
    /**
     * Returns the byteSize of a {@link Buffer} holding the serialized data of
     * {@link Pool} for the provided args.
     *
     * @param args need to be provided since the byte size for this account
     * depends on them
     */
    Pool.byteSize = function (args) {
        var instance = Pool.fromArgs(args);
        return exports.poolBeet.toFixedFromValue(__assign({ accountDiscriminator: poolDiscriminator }, instance)).byteSize;
    };
    /**
     * Fetches the minimum balance needed to exempt an account holding
     * {@link Pool} data from rent
     *
     * @param args need to be provided since the byte size for this account
     * depends on them
     * @param connection used to retrieve the rent exemption information
     */
    Pool.getMinimumBalanceForRentExemption = function (args, connection, commitment) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, connection.getMinimumBalanceForRentExemption(Pool.byteSize(args), commitment)];
            });
        });
    };
    /**
     * Returns a readable version of {@link Pool} properties
     * and can be used to convert to JSON and/or logging
     */
    Pool.prototype.pretty = function () {
        return {
            dataVersion: 'DataVersion.' + DataVersion_1.DataVersion[this.dataVersion],
            authority: this.authority.toBase58(),
            mint: this.mint.toBase58(),
            vault: this.vault.toBase58(),
            vaultBump: this.vaultBump,
            name: this.name,
            historyList: this.historyList,
            currentIndex: this.currentIndex,
            merkleTree: this.merkleTree
        };
    };
    return Pool;
}());
exports.Pool = Pool;
/**
 * @category Accounts
 * @category generated
 */
exports.poolBeet = new beet.FixableBeetStruct([
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['dataVersion', DataVersion_1.dataVersionBeet],
    ['authority', beetSolana.publicKey],
    ['mint', beetSolana.publicKey],
    ['vault', beetSolana.publicKey],
    ['vaultBump', beet.u8],
    ['name', beet.utf8String],
    ['historyList', beet.array(beet.uniformFixedSizeArray(beet.u8, 32))],
    ['currentIndex', beet.u8],
    ['merkleTree', MerkleTree_1.merkleTreeBeet],
], Pool.fromArgs, 'Pool');
