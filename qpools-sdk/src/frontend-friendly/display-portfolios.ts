import {Program, Provider} from "@project-serum/anchor";
import {Connection, PublicKey} from "@solana/web3.js";
import {WalletI} from "easy-spl";

/**
 * Includes all fetch operations for all file ...
 */
export class DisplayPortfolios {

    public connection: Connection;
    public provider: Provider;
    public solbondProgram: Program;

    constructor(
        connection: Connection,
        provider: Provider,
        solbondProgram: Program
    ) {
        this.connection = connection;
        this.provider = provider;
        this.solbondProgram = solbondProgram;
    }

}