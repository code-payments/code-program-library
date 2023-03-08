import treeify from "treeify";
import { sha256 } from "./sha256";

export interface Options {
    shorten: boolean;
    findZeros: boolean;
}

export class MerkleTree {
    levels: number;
    seeds: Buffer;

    root: Buffer;
    filledSubtrees: any[];
    zeroTree: any[];
    emptyValue: any;
    nextIndex: number;

    // We only need to store this on the server side. The on-chain program and
    // phones do not have this info.
    leaves: any[];

    constructor(seeds: Buffer, levels: number) {
        this.seeds = seeds;
        this.levels = levels;
        this.nextIndex = 0;

        this.filledSubtrees = [];
        this.zeroTree = [];
        this.leaves = [];

        this.calcZeros();
        this.root = this.zeroTree[this.zeroTree.length-1];

        for (let i = 0; i < levels; i++) {
            this.filledSubtrees[i] = this.zeroTree[i];
        }
    }

    addLeaf(leaf: Buffer) {
        if (this.nextIndex >= Math.pow(2, this.levels)) {
            throw "Merkle tree is full. No more leaves can be added"
        }

        leaf = sha256(leaf);
        this.leaves.push(leaf);

        let currentIndex = this.nextIndex;
        let currentLevelHash = leaf;
        let left: any, right: any;

        for (let i=0; i<this.levels; i++) {
            if (currentIndex % 2 == 0) {
                left = currentLevelHash;
                right = this.zeroTree[i];
                this.filledSubtrees[i] = currentLevelHash;
            } else {
                left = this.filledSubtrees[i];
                right = currentLevelHash;
            }

            currentLevelHash = hashLeftRight(left, right);
            currentIndex = Math.floor(currentIndex / 2);
        }

        this.root = currentLevelHash;
        this.nextIndex = this.nextIndex + 1;

        return this.nextIndex;
    }

    calcZeros() {
        // This matches the on-chain program. 

        let current = sha256(this.seeds);
        for (let i=0; i<this.levels; i++) {
            const combined = [
                current,
                current,
            ]

            current = sha256(Buffer.concat(combined));
            this.zeroTree.push(current);
        }

        this.emptyValue = this.zeroTree[0];
    }

    toString() {
        // This method is for debugging purposes.

        return JSON.stringify(JSON.parse(`{
                "nextIndex": ${this.nextIndex},
                "zeroTree": ${JSON.stringify(this.zeroTree.map(v => v.toString('hex')))},
                "filledSubtrees": ${JSON.stringify(this.filledSubtrees.map(v => v.toString('hex')))},
                "root": "${this.root.toString('hex')}"
            }`), null, 4);
    }

    prettyPrint() {
        // This method is for debugging purposes.

        return treeify.asTree(
            this.asTree({
                shorten: true,
                findZeros: true,
        }));
    }

    getRoot(): Buffer {
        return this.root;
    }

    getIndexForLeaf(leaf: Buffer): number {
        for (let i=0; i<this.leaves.length; i++) {
            if (Buffer.compare(leaf, this.leaves[i]) === 0) {
                return i;
            }
        }
    }

    getProofFor(commitment: Buffer, commitmentRootIndex: number): Buffer[] {
        const leaf = sha256(commitment);
        const index = this.getIndexForLeaf(leaf);
        return this.getProofForLeafAtIndex(index, commitmentRootIndex);
    }

    getProofForLeafAtIndex(
        for_leaf: number,                   // The leaf index to get a merkle proof for.
        until_leaf: number = this.nextIndex // The leaf index to stop at. (default: all leaves)
    ): Buffer[] {
        // Helper used for generating merkle proofs. Not used by the core logic
        // of the tree itself. The backend server will need something like this,
        // but the clients do not.

        // Important: The algorithm used here is inefficient. It is a brute
        // force solution. We will need a better approach in production. We
        // should be able to generate the proofs from periodically stored proofs
        // instead of hashing all the leaves.

        if (for_leaf > until_leaf) {
            throw "'for_leaf' must be less than 'until_leaf'";
        }

        if (this.leaves.length == 0) {
            return [...this.zeroTree];
        }

        // Hash all leaves from the bottom up; use the empty tree value as the
        // rightmost leaf.

        let layers =[];
        let currentLayer = this.leaves.slice(0, until_leaf + 1);
        for (let i = 0; i < this.levels; i++) {
            layers.push(currentLayer);

            if (currentLayer.length % 2 != 0) {
                currentLayer.push(this.zeroTree[i]);
            }
            currentLayer = hashPairs(currentLayer);
        }

        // At this point we have all the layers of the merkle tree in an array
        // of arrays. The next step is to find the siblings of the provided
        // for_leaf all the way up the tree.

        const proof = [];
        let currentIndex = for_leaf;
        let layerIndex = 0;
        let sibling : Buffer;

        for (let i=0; i<this.levels; i++) {
            if (currentIndex % 2 == 0) {
                sibling = layers[layerIndex][currentIndex+1];
            } else {
                sibling = layers[layerIndex][currentIndex-1];
            }
            proof.push(sibling);

            currentIndex = Math.floor(currentIndex / 2);
            layerIndex = layerIndex + 1;
        }

        return proof;
    }


    asTree(opt: Options = {shorten: false, findZeros: false}) {
        // This method is for debugging purposes. It returns a nested object
        // representation of the tree.

        // Important: The algorithm used here is inefficient. It is a brute
        // force solution. We will need a better approach in production. We
        // should be able to generate the proofs from periodically stored proofs
        // instead of hashing all the leaves.

        // On a positive note, it is not clear that we need this method outside
        // debuggigng purposes..

        const self = this;
        const lookupTable : {[key: string]: Buffer[]} = {};

        let layers =[];
        let currentLayer = [...this.leaves];
        for (let i = 0; i < this.levels; i++) {
            layers.push(currentLayer);

            if (currentLayer.length % 2 != 0) {
                currentLayer.push(self.zeroTree[i]);
            }
            currentLayer = hashPairs(currentLayer, lookupTable);
        }

        return { 
            [this.root.toString('hex')]: _getObj(this.root)
        };

        // Private function to get the object representation of a tree.
        function _getObj(val: any) {
            // Recursive helper for generating the structure expected by the
            // treeify.asTree() library.

            const hash = val.toString('hex');
            if (!lookupTable[hash]) { 
                if (opt.shorten) {
                    return hash.substring(0, 4) + '...' + hash.substring(hash.length - 4);
                }

                return hash;
            }

            let left = lookupTable[hash][0];
            let right = lookupTable[hash][1];

            let lkey = left.toString('hex'),
                rkey = right.toString('hex');

            if (opt.shorten) {
                lkey = lkey.substring(0, 4) + '...' + lkey.substring(lkey.length - 4);
                rkey = rkey.substring(0, 4) + '...' + rkey.substring(rkey.length - 4);
            }

            if (opt.findZeros) {
                if (self.zeroTree.includes(left)) {
                    lkey += " <Empty>";
                }
                if (self.zeroTree.includes(right)) {
                    rkey += " <Empty>";
                }
            }

            return {
                [lkey]: _getObj(left),
                [rkey]: _getObj(right),
            };
        }
    }
}

// This function is used to verify a merkle proof. It takes a proof, a
// root hash, and a leaf hash. It returns true if the leaf hash can be
// proven to be a part of the Merkle tree defined by the root hash.
// The proof is an array of sibling hashes, where each pair of leaves
// and each pair of pre-images are assumed to be sorted.
export function verify(proof: Buffer[], root: Buffer, leaf: Buffer) : boolean {
    let computed_hash = sha256(leaf);
    for (let proof_element of proof) {
        if (Buffer.compare(computed_hash, proof_element) <= 0) {
            // Hash(current computed hash + current element of the proof)
            computed_hash = sha256(Buffer.concat([computed_hash, proof_element]));
        } else {
            // Hash(current element of the proof + current computed hash)
            computed_hash = sha256(Buffer.concat([proof_element, computed_hash]));
        }

        //console.log(`verify(): Computed hash: ${computed_hash.toString('hex')}`);
    }

    // Check if the computed hash (root) is equal to the provided root
    return Buffer.compare(computed_hash, root) == 0;
}


function hashLeftRight(left: Buffer, right: Buffer) : any {
    const combined = [left, right];

    // Sorting here to make the merkle proofs deterministic
    combined.sort(Buffer.compare);
    return sha256(Buffer.concat(combined));
}


function hashPairs(pairs: any[], lookupTable: {[key: string]: Buffer[]} = {}) {
    // Helper used by the merkle proof and prettyPrint methods. It is not used
    // by the core logic of the merkle tree itself.
    
    // It takes an array of values and hashes all the pairs into an array of hashes.
    // Optionally, it provides a lookup table to reverse the hashes.

    // The backend server will need something like this, but the clients do
    // not.

    const res = [];
    for (let i = 0; i < pairs.length; i+=2) {
        const left = pairs[i+0];
        const right = pairs[i+1];

        const hashed = hashLeftRight(left, right);

        lookupTable[hashed.toString('hex')] = [left, right];

        res.push(hashed);
    }

    return res;
}