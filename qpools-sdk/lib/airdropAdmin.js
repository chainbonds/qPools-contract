"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const airdropAdmin = web3_js_1.Keypair.fromSecretKey(Uint8Array.from([
    149, 226, 18, 86, 166, 52, 2, 141, 172, 220, 209, 227, 65, 254, 79,
    35, 131, 85, 164, 23, 25, 8, 248, 223, 90, 167, 172, 144, 133, 236,
    229, 146, 188, 230, 180, 3, 5, 118, 190, 238, 157, 122, 51, 60, 83,
    186, 124, 199, 151, 67, 175, 226, 211, 199, 1, 115, 177, 75, 72, 51, 82, 16, 255,
    4
]));
exports.default = airdropAdmin;
