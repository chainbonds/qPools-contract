import * as anchor from "@project-serum/anchor";
import {Program, Provider} from "@project-serum/anchor";
import {getPayer} from "./utils";
import {Connection, Keypair} from "@solana/web3.js";
import { Network, SEED, Market, Pair } from '@invariant-labs/sdk'
import {invariantAmmProgram} from "./external_programs/invariant_amm";
import {createPoolWithLiquidity, createTokensAndPool} from "./invariant-utils";
import BN from "bn.js";
import {Decimal} from "@invariant-labs/sdk/lib/market";
import {fromFee} from "@invariant-labs/sdk/lib/utils";

/*
    TODO 1: Figure out how to import different external_programs into the tests here
 */
const DEFAULT_AIRDROP_AMOUNT = 10_000_000;
describe('solbond-yield-farming', () => {

    /*
        Logic on our side
     */
    // Configure the client to use the local cluster.
    const provider = anchor.Provider.env();
    anchor.setProvider(provider);
    const connection: Connection = provider.connection;

    // Have one Solbond Program
    // And have one InvariantAMM Program

    // We need to access another program, the AMM program!
    const solbondProgram = anchor.workspace.Solbond;
    // const payer = getPayer();

    /*
    * Logic from the Invariant Side
    * */
    // This will not change, so we can just import using the IDL
    const invariantProgramId = new anchor.web3.PublicKey("3f2yCuof5e1MpAC8RNgWVnQuSHpDjUHPGds6jQ1tRphY");
    const invariantProgram = invariantAmmProgram(connection, provider, invariantProgramId);
    // console.log("Invariant program is: ", invariantProgram);

    // @ts-expect-error
    const wallet = provider.wallet.payer as Keypair;
    const mintAuthority = Keypair.generate();
    const positionOwner = Keypair.generate();
    const admin = Keypair.generate();
    const market = new Market(
        Network.LOCAL,
        provider.wallet,
        connection,
        invariantProgramId
    );
    const protocolFee: Decimal = { v: fromFee(new BN(10000))};


    // Initialize a third party who owns the pool
    before(async () => {
        console.log("Before ok")
    })


    it("Initialize the state of the world", async () => {
       console.log("Hello");

        // Initialize a third party use who owns the pool
        // const poolOwner = Keypair.generate();
        // await provider.connection.requestAirdrop(poolOwner.publicKey, DEFAULT_AIRDROP_AMOUNT);
        await market.createState(wallet, protocolFee);
        console.log("Created the state!");

        // Initialize pools, including token, feeTier, pair, including a lot of liquidity
        await createPoolWithLiquidity(
            market,
            connection,
            wallet
        );
        console.log("Created a pool with liquidity!");

    });



});
