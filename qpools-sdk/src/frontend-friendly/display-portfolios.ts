import {Program, Provider} from "@project-serum/anchor";
import {Connection} from "@solana/web3.js";

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