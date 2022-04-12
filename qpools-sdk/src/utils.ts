import { web3, Provider, BN } from '@project-serum/anchor';
import {ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID, u64} from '@solana/spl-token';
import {PublicKey, Keypair, Transaction, Connection, TransactionInstruction, TokenAmount} from "@solana/web3.js";
import {account, util, WalletI} from "easy-spl";
import {Wallet} from "@project-serum/anchor/src/provider";
import {Buffer} from "buffer";
const spl = require("@solana/spl-token");

const DEFAULT_DECIMALS = 6;

let _payer: Keypair | null = null;

// TODO: The usage of this is ambigious. I need to chase these bugs everywhere!!!
// TODO: Write tests for this stupid shit ...
/**
 *
 * @param x The big-number that should be written into a tokenAmountNumber. Should be lamports, and include decimals!
 *  This cannot be negative
 * @param decimals
 */
export const getTokenAmount = (x: BN, decimals: BN): TokenAmount => {
    let decimalsAsNumber = decimals.toNumber();
    let decimalExpanded = (new BN(10)).pow(decimals);
    let uiAmount = Math.max(x.toNumber() / decimalExpanded.toNumber(), 0.0);
    return {
        amount: x.toString(),
        decimals: decimalsAsNumber,
        uiAmount: uiAmount,
        uiAmountString: uiAmount.toString()
    };
}

export class QWallet implements Wallet {

    constructor(readonly payer: Keypair) {
        this.payer = payer
    }

    async signTransaction(tx: Transaction): Promise<Transaction> {
        tx.partialSign(this.payer);
        return tx;
    }

    async signAllTransactions(txs: Transaction[]): Promise<Transaction[]> {
        return txs.map((t) => {
            t.partialSign(this.payer);
            return t;
        });
    }

    get publicKey(): PublicKey {
        return this.payer.publicKey;
    }
}

export async function sendAndSignTransaction(provider: Provider, tx: Transaction) {
    let sg = await provider.send(tx);
    await provider.connection.confirmTransaction(sg, "confirmed");
    console.log("Transaction Signature is: ", sg);
    return sg;
}

export async function sendAndSignInstruction(provider: Provider, ix: TransactionInstruction) {
    let tx = new Transaction();
    tx.add(ix);
    let sg = await provider.send(tx);
    await provider.connection.confirmTransaction(sg, "confirmed");
    console.log("Transaction Signature is: ", sg);
    return sg;
}

export const sendAndConfirmTransaction = async (
    programProvider: Provider,
    connection: Connection,
    tx: Transaction,
    // feePayer: PublicKey
) => {
    // Get blockhash
    // const blockhash = await connection.getRecentBlockhash();
    // tx.recentBlockhash = blockhash.blockhash!;
    // tx.feePayer = feePayer;
    // Assign feePayer

    // Send and Confirm
    console.log("Signing transaction...");
    //console.log("About to send the following transactions: ", tx);
    //console.log("Program provider is: ", programProvider, typeof programProvider);
    console.log("Sending wallet is: ",  programProvider.wallet.publicKey.toString());
    let sg = await programProvider.send(tx);
    console.log("sg1 is: ", sg);
    await connection.confirmTransaction(sg, 'confirmed');
}

/**
 * Big Number to u32 (32 bit integer)
 * @param bn
 */
export function bnTo8(bn: BN): Uint8Array {
    return Buffer.from([...bn.toArray("le", 4)])
}

export function bnTo1(bn: BN): Uint8Array {
    return Buffer.from([...bn.toArray("le", 1)])
}

export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const tokenAccountExists = async (
    conn: web3.Connection,
    account: web3.PublicKey,
): Promise<boolean> => {
    if (!account) {
        return false;
    }
    const info = await conn.getParsedAccountInfo(account)
    return info.value !== null
}

export const accountExists = async (
    conn: web3.Connection,
    account: web3.PublicKey
): Promise<boolean> => {
    // Return false, if account is null!
    if (!account) {
        return false;
    }
    const info = await conn.getParsedAccountInfo(account)
    return info.value !== null
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
    const tx = await createAssociatedTokenAccountUnsigned(conn, mint, address, owner, wallet);
    await util.sendAndConfirm(conn, tx);
    return address
}

export const getAccountForMintAndPDADontCreate = async (mintKey: PublicKey, pda: PublicKey) => {
    return await getAssociatedTokenAddressOffCurve(mintKey, pda);
}

export const getAccountForMintAndPDA = async (connection: Connection, wallet: WalletI, payer: Keypair, mintKey: PublicKey, pda: PublicKey) => {
    try {
        // console.log("this wallet ", this.wallet.publicKey.toString())
        // console.log("this provider wallet  ", this.provider.wallet.publicKey.toString())
        // console.log("this qpoolacc ", this.qPoolAccount.toString())

        let tx = await createAssociatedTokenAccountUnsigned(
            connection,
            mintKey,
            null,
            pda,
            wallet,
        );
        const sg = await connection.sendTransaction(tx, [payer]);
        await connection.confirmTransaction(sg);
        //console.log("Signature for token A is: ", sg);
    } catch (e) {
        //console.log("Error is: ");
        //console.log(e);
    }

    const userAccount = await getAssociatedTokenAddressOffCurve(mintKey, pda);
    return userAccount;
}

export const getAssociatedTokenAddressOffCurve = async (
    mint: web3.PublicKey,
    user: web3.PublicKey
): Promise<web3.PublicKey> => {
    return Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mint, user, true);
}

export const createAssociatedTokenAccountUnsignedInstruction = async (
    conn: web3.Connection,
    mint: web3.PublicKey,
    address: web3.PublicKey | null,
    owner: web3.PublicKey,
    wallet: WalletI,
): Promise<web3.Transaction> => {
    if (!address) {
        address = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mint, owner, true);
    }
    let instructions = [
        Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            mint,
            address,
            owner,
            wallet.publicKey
        )
    ]
    let tx = await util.wrapInstructions(conn, instructions, wallet.publicKey);
    return tx;
}

export const createAssociatedTokenAccountUnsigned = async (
    conn: web3.Connection,
    mint: web3.PublicKey,
    address: web3.PublicKey | null,
    owner: web3.PublicKey,
    wallet: WalletI,
): Promise<web3.Transaction> => {
    if (!address) {
        address = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mint, owner, true);
    }
    let instructions = [
            Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            mint,
            address,
            owner,
            wallet.publicKey
        )
    ]
    let tx = await util.wrapInstructions(conn, instructions, wallet.publicKey);
    // const tx = await createAssociatedTokenAccountTx(conn, mint, owner, wallet.publicKey);
    return await wallet.signTransaction(tx);
}

export interface IWallet {
    signTransaction(tx: Transaction): Promise<Transaction>
    signAllTransactions(txs: Transaction[]): Promise<Transaction[]>
    publicKey: PublicKey
}

export const tou64 = (amount: any) => {
    // @ts-ignore
    // eslint-disable-next-line new-cap
    return new u64(amount.toString())
}

// can't remember what this is
export interface Tickmap {
    bitmap: Array<number>
}
