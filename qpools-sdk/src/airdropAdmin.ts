import {Keypair} from "@solana/web3.js";

// const airdropAdmin = Keypair.fromSecretKey(Uint8Array.from([
//     149, 226, 18, 86, 166, 52, 2, 141, 172, 220, 209, 227, 65, 254, 79,
//     35, 131, 85, 164, 23, 25, 8, 248, 223, 90, 167, 172, 144, 133, 236,
//     229, 146, 188, 230, 180, 3, 5, 118, 190, 238, 157, 122, 51, 60, 83,
//     186, 124, 199, 151, 67, 175, 226, 211, 199, 1, 115, 177, 75, 72, 51, 82, 16, 255,
//     4
// ]));

// Admin account to use for test minting test tokens + adding assets
// This is using invariant's account!
const airdropAdmin = Keypair.fromSecretKey(Uint8Array.from([
    85, 51, 81, 126, 224, 250, 233, 174, 133, 40, 112, 237, 109, 244, 6, 62, 193, 121, 239, 246, 11,
    77, 215, 9, 0, 18, 83, 91, 115, 65, 112, 238, 60, 148, 118, 6, 224, 47, 54, 140, 167, 188, 182,
    74, 237, 183, 242, 77, 129, 107, 155, 20, 229, 130, 251, 93, 168, 162, 156, 15, 152, 163, 229, 119
]))

export default airdropAdmin
