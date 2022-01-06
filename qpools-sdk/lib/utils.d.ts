/// <reference types="bn.js" />
import { web3, Provider, BN } from '@project-serum/anchor';
import { Token, u64 } from '@solana/spl-token';
import { PublicKey, Keypair, Transaction } from "@solana/web3.js";
import { WalletI } from "easy-spl";
export declare function delay(ms: number): Promise<unknown>;
export declare function createMint2(provider: any): Promise<any>;
export declare function createMint(provider: Provider, payer: Keypair, authority?: web3.PublicKey, decimals?: number): Promise<Token>;
export declare function getPayer(): Keypair;
export declare function createTokenAccount(provider: any, mint: any, owner: any): Promise<any>;
export declare function waitForEpoch(epoch: BN, provider: Provider): Promise<void>;
export declare function getBlockchainEpoch(provider: Provider): Promise<number>;
/**
 * Associated Token Account
 * @param conn
 * @param mint
 * @param owner
 * @param wallet
 */
export declare const createAssociatedTokenAccountSendUnsigned: (conn: web3.Connection, mint: web3.PublicKey, owner: web3.PublicKey, wallet: WalletI) => Promise<web3.PublicKey>;
export declare const getAssociatedTokenAddressOffCurve: (mint: web3.PublicKey, user: web3.PublicKey) => Promise<web3.PublicKey>;
export declare const createAssociatedTokenAccountUnsigned: (conn: web3.Connection, mint: web3.PublicKey, address: web3.PublicKey | null, owner: web3.PublicKey, wallet: WalletI) => Promise<web3.Transaction>;
export interface IWallet {
    signTransaction(tx: Transaction): Promise<Transaction>;
    signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
    publicKey: PublicKey;
}
export declare const tou64: (amount: any) => u64;
export interface Tickmap {
    bitmap: Array<number>;
}
