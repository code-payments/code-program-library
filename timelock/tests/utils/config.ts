export const PREFIX_TIMELOCK_STATE = "timelock_state";
export const PREFIX_TIMELOCK_VAULT = "timelock_vault";
export const VERSION_1 = 3;

export function getAnchorConfig(key:string)  {
    const fs = require('fs');
    const config = fs.readFileSync('Anchor.toml', 'utf-8');
    const regex = new RegExp(`^\\s*${key}\\s*=\\s*"([^"]+)"`, 'm');
    return config.match(regex)[1];
}

export function setEnvironment() {
    const process = require("process");
    if (!process.env.ANCHOR_WALLET) {
        process.env["ANCHOR_WALLET"] = getAnchorConfig("wallet");
    }
    if (!process.env.ANCHOR_PROVIDER_URL) {
        process.env["ANCHOR_PROVIDER_URL"] = "http://127.0.0.1:8899/"
    }
}