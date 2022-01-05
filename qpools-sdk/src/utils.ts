
import { web3, Provider, BN } from '@project-serum/anchor';
import {ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID, u64} from '@solana/spl-token';
import {PublicKey, Keypair, Transaction} from "@solana/web3.js";
import {account, util, WalletI} from "easy-spl";
import {createAssociatedTokenAccountTx} from "easy-spl/dist/tx/associated-token-account";
const spl = require("@solana/spl-token");

const DEFAULT_DECIMALS = 6;

let _payer: Keypair | null = null;

export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function createMint2(provider: any) {
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

export async function createTokenAccount(provider: any, mint: any, owner: any) {
    const token = new spl.Token(
        provider.connection,
        mint,
        TOKEN_PROGRAM_ID,
        provider.wallet.payer
    );
    let vault = await token.createAssociatedTokenAccount(owner);
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

/*
    Associated Token Accounts
*/

/**
 * Associated Token Account
 * @param conn
 * @param mint
 * @param owner
 * @param wallet
 */
export const createAssociatedTokenAccountSendUnsigned = async (
    conn: web3.Connection,
    mint: web3.PublicKey,
    owner: web3.PublicKey,
    wallet: WalletI,
): Promise<web3.PublicKey> => {
    const address = await getAssociatedTokenAddressOffCurve(mint, owner)
    if (await account.exists(conn, address)) {
        return address
    }
    const tx = await createAssociatedTokenAccountUnsigned(conn, mint, address, owner, wallet)
    await util.sendAndConfirm(conn, tx)
    return address
}

export const getAssociatedTokenAddressOffCurve = async (
    mint: web3.PublicKey,
    user: web3.PublicKey
): Promise<web3.PublicKey> => {
    //@ts-ignore
    return Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mint, user, true);
}

export const createAssociatedTokenAccountUnsigned = async (
    conn: web3.Connection,
    mint: web3.PublicKey,
    address: web3.PublicKey | null,
    owner: web3.PublicKey,
    wallet: WalletI,
): Promise<web3.Transaction> => {
    const tx = await createAssociatedTokenAccountTx(conn, mint, owner, wallet.publicKey)
    return await wallet.signTransaction(tx);
}

export interface IWallet {
    signTransaction(tx: Transaction): Promise<Transaction>
    signAllTransactions(txs: Transaction[]): Promise<Transaction[]>
    publicKey: PublicKey
}

export const tou64 = (amount) => {
    // @ts-ignore
    // eslint-disable-next-line new-cap
    return new u64(amount.toString())
}

// can't remember what this is
export interface Tickmap {
    bitmap: Array<number>
}
