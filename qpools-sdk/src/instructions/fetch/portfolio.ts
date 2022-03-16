import {Connection, PublicKey} from "@solana/web3.js";
import {Program} from "@project-serum/anchor";
import {PortfolioAccount} from "../../types/account/portfolioAccount";
import {accountExists} from "../../utils";
import {getPortfolioPda} from "../../types/account/pdas";

export async function portfolioExists(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey
): Promise<boolean> {
    console.log("#portfolioExists");
    let out: boolean
    let [portfolioPda, _] = await getPortfolioPda(owner, solbondProgram);
    if (connection) {
        out = await accountExists(connection, portfolioPda);
    } else {
        // Maybe let it rerun after a second again ...
        out = false;
    }
    console.log("##portfolioExists");
    return out;
}

export async function fetchPortfolio(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey
): Promise<PortfolioAccount | null> {
    console.log("#fetchPortfolio()");
    let [portfolioPda, _] = await getPortfolioPda(owner, solbondProgram);
    let portfolioContent = null;
    console.log("Before trying to fetch");
    if (await accountExists(connection, portfolioPda)) {
        console.log("Exists and trying to fetch");
        portfolioContent = (await solbondProgram.account.portfolioAccount.fetch(portfolioPda)) as PortfolioAccount;
    }
    console.log("Now fetching again ...", portfolioContent);
    console.log("##fetchPortfolio()");
    return portfolioContent;
}
