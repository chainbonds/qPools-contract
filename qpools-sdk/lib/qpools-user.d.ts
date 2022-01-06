/**
 * This is the file that can later on be shared with the frontend
 * The other qpools files will be used as an admin, and should probably not be open
 */
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Program, Provider } from "@project-serum/anchor";
import { Token } from "@solana/spl-token";
import { IWallet } from "./utils";
export declare class QPoolsUser {
    connection: Connection;
    wallet: IWallet;
    walletPayer: Keypair;
    solbondProgram: Program;
    provider: Provider;
    qPoolAccount: PublicKey;
    bumpQPoolAccount: number;
    QPTokenMint: Token;
    currencyMint: Token;
    qPoolQPAccount: PublicKey;
    purchaserCurrencyAccount: PublicKey;
    purchaserQPTAccount: PublicKey;
    qPoolCurrencyAccount: PublicKey;
    constructor(provider: Provider, connection: Connection, currencyMint: Token);
    loadExistingQPTReserve(currencyMintPubkey: PublicKey): Promise<void>;
    registerAccount(): Promise<void>;
    prettyPrintAccounts(): void;
    buyQPT(currency_amount_raw: number, verbose?: boolean): Promise<boolean>;
    redeemQPT(qpt_amount_raw: number, verbose?: boolean): Promise<boolean>;
}
