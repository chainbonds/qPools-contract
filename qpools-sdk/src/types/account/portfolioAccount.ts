import {PublicKey} from "@solana/web3.js";
import {BN} from "@project-serum/anchor";
import {u64} from "@solana/spl-token";
import {tou64} from "../../utils";

export interface PortfolioAccount {
    owner: PublicKey,
    bump: number,

    toBeRedeemed: boolean,
    fullyCreated: boolean,
    //pub all_positions_redeemed: bool,

    initialAmountUSDC: u64,
    withdrawAmountUSDC: u64,

    numRedeemed: number,
    numPositions: number,

    // time when portfolio signed
    startTimestamp: BN,

    // time when portfolio is fulfilled
    fulfilledTimestamp: BN,
}

/**
 * This function is wrong, do not use this!
 */
// export const bufferToPortfolio = (buffer: Buffer): PortfolioAccount => {
//
//     let defaultOffset = 8;
//
//     // Make sure bits and bytes match up!
//     let portfolioAccount: PortfolioAccount = {
//         owner: new PublicKey(buffer.slice(0, 32)),
//         bump: buffer.readUInt8(32),
//         toBeRedeemed: buffer.readUInt8(33).valueOf() ? true : false,
//         fullyCreated: buffer.readUInt8(34).valueOf() ? true : false,
//         initialAmountUSDC: tou64(buffer.readBigUInt64LE(35)),
//         withdrawAmountUSDC: tou64(buffer.readBigUInt64LE(43)),
//         numRedeemed: buffer.readUInt32LE(51),
//         numPositions: buffer.readUInt32LE(55),
//         startTimestamp: tou64(buffer.readBigInt64LE(59)),
//         fulfilledTimestamp: tou64(buffer.readBigInt64LE(67)),
//     }
//     console.log("Deserialized Portfolio Object is: ", portfolioAccount, buffer.length, 75);
//     console.log({
//         owner: portfolioAccount.owner.toString(),
//         bump: portfolioAccount.bump.toString(),
//         toBeRedeemed: portfolioAccount.toBeRedeemed.toString(),
//         fullyCreated: portfolioAccount.fullyCreated.toString(),
//         initialAmountUSDC: portfolioAccount.initialAmountUSDC.toString(),
//         withdrawAmountUSDC: portfolioAccount.withdrawAmountUSDC.toString(),
//         numRedeemed: portfolioAccount.numRedeemed.toString(),
//         numPositions: portfolioAccount.numPositions.toString(),
//         startTimestamp: portfolioAccount.startTimestamp.toString(),
//         fulfilledTimestamp: portfolioAccount.fulfilledTimestamp.toString(),
//     })
//     return portfolioAccount;
// }

// pub weights: [u64; 3],
// pub owner: Pubkey,
//     pub bump: u8,

