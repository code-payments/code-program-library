import crypto from "crypto";

export function sha256(data: any) {
    return crypto.createHash('sha256').update(data).digest()
}