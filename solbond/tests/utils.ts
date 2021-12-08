import { web3, Provider, BN } from '@project-serum/anchor';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {PublicKey, Keypair} from "@solana/web3.js";
const spl = require("@solana/spl-token");

const DEFAULT_DECIMALS = 6;

let _payer: Keypair | null = null;



export async function createMint2(provider) {
    let authority = provider.wallet.publicKey;

    const mint = await spl.Token.createMint(
        provider.connection,
        provider.wallet.payer,
        authority,
        null,
        9,
        TOKEN_PROGRAM_ID
    );
    return mint;
}
export async function createMint(
    provider: Provider, 
    payer: Keypair, 
    authority?: web3.PublicKey,
    decimals = DEFAULT_DECIMALS,
): Promise<Token> {
    if (authority === undefined) {
        authority = provider.wallet.publicKey;
    }
    const token = await Token.createMint(
        provider.connection,
        payer,
        authority,
        authority,
        decimals,
        TOKEN_PROGRAM_ID,
    );

    return token;
}

export function getPayer(): Keypair {
    if (_payer != null) {
        return _payer;
    }
    const process = require("process");
    _payer = Keypair.fromSecretKey(
        Buffer.from(
            JSON.parse(
                require("fs").readFileSync(process.env.ANCHOR_WALLET, {
                    encoding: "utf-8",
                })
            )
        )
    );
    return _payer;
}

export async function createTokenAccount(provider, mint, owner) {
    const token = new spl.Token(
        provider.connection,
        mint,
        TOKEN_PROGRAM_ID,
        provider.wallet.payer
    );
    let vault = await token.createAccount(owner);
    return vault;
}

export async function waitForEpoch(epoch: BN, provider: Provider): Promise<void> {
    let now = await getBlockchainEpoch(provider);
    while (now <= epoch.toNumber()) {
        await sleep(1000);
        now = await getBlockchainEpoch(provider);
    }
    return new Promise(async (resolve) => {
        resolve();
    });
}

export async function getBlockchainEpoch(provider: Provider): Promise<number> {
    const currentSlot = (await provider.connection.getEpochInfo()).absoluteSlot;
    const time = await provider.connection.getBlockTime(currentSlot);
    return time!
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
