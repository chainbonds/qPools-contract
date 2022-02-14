import {Program, Provider} from "@project-serum/anchor";
import {Connection, PublicKey} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import {SEED} from "../seeds";
import {WalletI} from "easy-spl";
import {u64} from "@solana/spl-token";
import {PortfolioAccount} from "../types/portfolioAccount";
import {PositionAccount} from "../types/positionAccount";


export class DisplayPortfolios {

    public connection: Connection;
    public provider: Provider;
    public solbondProgram: Program;

    public owner: WalletI;

    constructor(
        connection: Connection,
        provider: Provider,
        solbondProgram: Program
    ) {
        this.connection = connection;
        this.provider = provider;
        this.solbondProgram = solbondProgram;

        this.owner = this.provider.wallet;

    }


    /**
     * Given the portfolio pubkey, return all the PDAs that this portfolio has deposited something in
     * @param portfolio
     */
    async getAllPortfolioPDAs(portfolio: PublicKey) {


    }

}