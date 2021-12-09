import * as anchor from "@project-serum/anchor";
import {Program, Provider} from "@project-serum/anchor";
import {getPayer} from "./utils";
import {Connection, Keypair} from "@solana/web3.js";
import { Network, SEED, Market, Pair } from '@invariant-labs/sdk'
import {invariantAmmProgram} from "./external_programs/invariant_amm";

/*
    TODO 1: Figure out how to import different external_programs into the tests here
 */
describe('solbond-yield-farming', () => {

    /*
        Logic on our side
     */
    // Configure the client to use the local cluster.
    const provider = anchor.Provider.env();
    const connection: Connection = provider.connection;

    // Have one Solbond Program
    // And have one InvariantAMM Program

    // We need to access another program, the AMM program!
    const solbondProgram = anchor.workspace.Solbond;
    const payer = getPayer();

    /*
    * Logic from the Invariant Side
    * */
    // This will not change, so we can just import using the IDL
    const invariantProgram = invariantAmmProgram(connection, provider);
    const invariantProgramId = new anchor.web3.PublicKey("3f2yCuof5e1MpAC8RNgWVnQuSHpDjUHPGds6jQ1tRphY");

    // @ts-expect-error
    const wallet = provider.wallet.payer as Keypair
    const mintAuthority = Keypair.generate()
    const positionOwner = Keypair.generate()
    const admin = Keypair.generate()
    const market = new Market(
        Network.LOCAL,
        provider.wallet,
        connection,
        invariantProgramId
    )

    it("Initialize the state of the world", async () => {
       console.log("Hello")
    });



});
