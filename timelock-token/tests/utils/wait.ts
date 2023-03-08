// A timeout to prevent 429 errors (too many requests) on the testnet/devnet etc...
export const SAFE_REQ_TIMEOUT = 100; //ms

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function api_wait() {
    return await sleep(SAFE_REQ_TIMEOUT);
}