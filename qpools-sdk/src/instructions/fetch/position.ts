import {Connection, PublicKey} from "@solana/web3.js";
import {Program} from "@project-serum/anchor";
import {PositionAccountSaber} from "../../types/account/positionAccountSaber";
import {getPortfolioPda, getPositionPda} from "../../types/account/pdas";
import {accountExists} from "../../utils";
import {PositionAccountMarinade} from "../../types/account/positionAccountMarinade";
import {sol} from "easy-spl";
import {fetchPortfolio} from "./portfolio";
import {PortfolioAccount} from "../../types/account/portfolioAccount";
import {Protocol} from "../../types/positionInfo";

// TODO: This position can either be a Marinade Position, or a Saber Position. Make sure to distinguish between the two!
/**
 * Fetch the position account
 * @param index The index at which this position is stored. Be careful not to mix the protocol types with the indecies
 */
export async function fetchSinglePositionSaber(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    index: number
): Promise<PositionAccountSaber | null> {
    console.log("#fetchSinglePosition()");
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    console.log("(2) portfolio PDA: ", positionPDA, typeof positionPDA);
    let positionContent = null;
    if (await accountExists(connection, positionPDA)) {
        let response = await solbondProgram.account.positionAccountSaber.fetch(positionPDA);
        positionContent = response as PositionAccountSaber;
    }
    console.log("##fetchSinglePosition()");
    return positionContent;
}

export async function fetchSinglePositionMarinade(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
    index: number
): Promise<PositionAccountMarinade | null> {
    console.log("#fetchSinglePosition()");
    let [positionPDA, bumpPosition] = await getPositionPda(owner, index, solbondProgram);
    console.log("(2) portfolio PDA: ", positionPDA, typeof positionPDA);
    let positionContent = null;
    if (await accountExists(connection, positionPDA)) {
        let response = await solbondProgram.account.positionAccountMarinade.fetch(positionPDA);
        positionContent = response as PositionAccountMarinade;
    }
    console.log("##fetchSinglePosition()");
    return positionContent;
}

export async function fetchAllPositions(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
): Promise<(PositionAccountSaber | PositionAccountMarinade)[]> {
    console.log("#fetchAllPositionsSaber()");
    // Enumerate all PDA addresses ...
    // Get how many positions there are in total ...
    // let out: (PositionAccountSaber | PositionAccountMarinade)[] = [];
    // let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let portfolio: PortfolioAccount = await fetchPortfolio(connection, solbondProgram, owner);
    let pdas: PublicKey[] = (await Promise.all(
        (new Array(portfolio.numPositions).fill(''))
            .map(async (_, index: number) => {
                return await getPositionPda(owner, index, solbondProgram)
            })
    )).map((x: [PublicKey, number]) => x[0]);
    console.log("PDAs are: ", pdas.map((x) => x.toString()));

    // Fetch multiple for saber
    let responseSaber = await solbondProgram.account.positionAccountSaber.fetchMultiple(pdas);
    let accountsSaber = responseSaber.filter((x: Object | null) => x).map((x: Object) => x as PositionAccountSaber);
    let responseMarinade = await solbondProgram.account.positionAccountMarinade.fetchMultiple(pdas);
    let accountsMarinade = responseMarinade.filter((x: Object | null) => x).map((x: Object) => x as PositionAccountMarinade);

    let out = [...accountsSaber, ...accountsMarinade];
    // out.set(Protocol.Saber, accountsSaber);
    // out.set(Protocol.Marinade, accountsMarinade);
    // out = [...accountsSaber, ...accountsMarinade];
    // console.log("##fetchAllPositionsSaber()");
    // return out
    return out;
};

export async function fetchAllPositionsSaber(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
): Promise<PositionAccountSaber[]> {
    console.log("#fetchAllPositionsSaber()");
    // Enumerate all PDA addresses ...
    // Get how many positions there are in total ...
    // let out: (PositionAccountSaber | PositionAccountMarinade)[] = [];
    // let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let portfolio: PortfolioAccount = await fetchPortfolio(connection, solbondProgram, owner);
    let pdas: PublicKey[] = (await Promise.all(
        (new Array(portfolio.numPositions).fill(''))
            .map(async (_, index: number) => {
                return await getPositionPda(owner, index, solbondProgram)
            })
    )).map((x: [PublicKey, number]) => x[0]);
    console.log("PDAs are: ", pdas.map((x) => x.toString()));

    // Fetch multiple for saber
    let responseSaber = await solbondProgram.account.positionAccountSaber.fetchMultiple(pdas);
    let accountsSaber = responseSaber.filter((x: Object | null) => x).map((x: Object) => x as PositionAccountSaber);

    return accountsSaber
};

export async function fetchAllPositionsMarinade(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey,
): Promise<PositionAccountMarinade[]> {
    console.log("#fetchAllPositionsSaber()");
    // Enumerate all PDA addresses ...
    // Get how many positions there are in total ...
    // let out: (PositionAccountSaber | PositionAccountMarinade)[] = [];
    // let [portfolioPda, portfolioBump] = await getPortfolioPda(owner, solbondProgram);
    let portfolio: PortfolioAccount = await fetchPortfolio(connection, solbondProgram, owner);
    let pdas: PublicKey[] = (await Promise.all(
        (new Array(portfolio.numPositions).fill(''))
            .map(async (_, index: number) => {
                return await getPositionPda(owner, index, solbondProgram)
            })
    )).map((x: [PublicKey, number]) => x[0]);
    console.log("PDAs are: ", pdas.map((x) => x.toString()));

    // Fetch multiple for saber
    let responseMarinade = await solbondProgram.account.positionAccountMarinade.fetchMultiple(pdas);
    let accountsMarinade = responseMarinade.filter((x: Object | null) => x).map((x: Object) => x as PositionAccountMarinade);

    return accountsMarinade;
};

// export async function fetchAllPositionsSaber(
//     connection: Connection,
//     solbondProgram: Program,
//     owner: PublicKey,
// ): Promise<PositionAccountSaber[] | null> {
//     console.log("#fetchAllPositionsSaber()");
//     let response = await solbondProgram.account.positionAccountSaber.all();
//     let positionContent = response as PositionAccountMarinade;
//     console.log("##fetchAllPositionsSaber()");
// }
//
// export async function fetchAllPositionsMarinade(
//     connection: Connection,
//     solbondProgram: Program,
//     owner: PublicKey,
// ): Promise<PositionAccountMarinade[] | null> {
//     console.log("#fetchAllPositionsMarinade()");
//     let response = await solbondProgram.account.positionAccountMarinade.();
//     let positionContent = response as PositionAccountMarinade;
//     console.log("##fetchAllPositionsMarinade()");
// }
