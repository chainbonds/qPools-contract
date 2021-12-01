
import {PublicKey} from "@solana/web3.js";

// TODO: Need to have a switch between devnet and mainnet

export const PROGRAM_ID_SOLBOND: PublicKey = new PublicKey(
    'GGoMTmrJtapovtdjZLv1hdbgZeF4pj8ANWxRxewnZ35g'
);

// Taken from https://docs.marinade.finance/deit velopers/contract-addresses
export const PROGRAM_ID_MARINADE: PublicKey = new PublicKey(
    'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD'
);

export const SERUM_TOKEN_LIST_URL = "https://github.com/project-serum/spl-token-wallet/blob/master/src/utils/tokens/names.js"

export const TOKEN_LIST_MAINNET = [
    {
        tokenSymbol: 'USDC',
        mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenName: 'USD Coin',
        icon:
            'https://raw.githubusercontent.com/trustwallet/assets/f3ffd0b9ae2165336279ce2f8db1981a55ce30f8/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    },
];

export const TOKEN_LIST_DEVNET = [
    {
        tokenSymbol: 'USDC',
        mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenName: 'USD Coin',
        icon:
            'https://raw.githubusercontent.com/trustwallet/assets/f3ffd0b9ae2165336279ce2f8db1981a55ce30f8/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    },
]

/**
     Based on whether we are on devnet, or on mainnet,
     gotta list different mint addresses
 */
export const getTokenList = () => {
    return TOKEN_LIST_DEVNET;
}