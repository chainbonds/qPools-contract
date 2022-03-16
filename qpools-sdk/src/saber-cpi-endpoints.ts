import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import {Program, Provider, web3} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {BN} from "@project-serum/anchor";
import {u64} from "@solana/spl-token";
import {assert} from "chai";
import {createAssociatedTokenAccountUnsigned, getAssociatedTokenAddressOffCurve, IWallet} from "./utils";
import {StableSwap, StableSwapState} from "@saberhq/stableswap-sdk";
import {MOCK} from "./const";
import {getPoolState} from "./instructions/fetch/saber";

/*
    doing a deposit: 
        a function which registers the portfolio with the weights
        an endpoint for calling the create_position instruction 
        a function which creates the whole portfolio
*/
export class SaberInteractTool {

    public connection: Connection;
    public solbondProgram: Program;
    public provider: Provider;
    public wallet: Keypair;
    public providerWallet: IWallet;

    public owner_pubkey: PublicKey;
    // All tokens owned by the protocol
    public qPoolAccount: PublicKey //| null = null;  // qPool Account
    public bumpQPoolAccount: number //| null = null;

    public QPTokenMint: Token | undefined;  // qPool `redeemable` tokens
    public qPoolQPAccount: PublicKey | undefined;
    public qPoolCurrencyAccount: PublicKey | undefined;
    public stableSwapProgramId: PublicKey | undefined;

    public currencyTokenMint: PublicKey | undefined;

    public QPReserveTokens: Record<string, PublicKey> = {};


    public mintA: Token | undefined;
    public mintB: Token | undefined;
    public poolMint: Token | undefined;

    public userAccountA: PublicKey | undefined;
    public userAccountB: PublicKey | undefined;
    public userAccountPoolToken: PublicKey | undefined;

    public fetchedStableSwapPool: StableSwap | undefined;
    public stableSwapState: StableSwapState | undefined;


    constructor(
        connection: Connection,
        provider: Provider,
        solbondProgram: Program,
        wallet: Keypair, 
    ) {


    }



}