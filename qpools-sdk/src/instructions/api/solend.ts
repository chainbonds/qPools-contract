/**
 * Probably could also just use the SDK to get the tokens
 *
 * TODO: Modify this file to account for distinction between devnet and testnet
 *  Replace the LogoFromSymbol with LogoFromMint for Mainnet ...
 */

import {SolendAction, SolendMarket, SolendReserve} from "@solendprotocol/solend-sdk";
import {Connection, PublicKey} from "@solana/web3.js";
import {BN} from "@project-serum/anchor";
import {ExplicitPool, ExplicitSolendPool, ExplicitToken, Protocol, ProtocolType} from "../../types/interfacing";


export const getSolendTokens = async (): Promise<ExplicitToken[]> => {
    let connection = new Connection("https://api.google.devnet.solana.com");
    const market = await SolendMarket.initialize(connection, "devnet");
    // console.log(market.reserves.map(reserve => reserve.config.loanToValueRatio);
    // console.log("market reserves are: ");
    // console.log(market);
    // console.log("Config is: ", market.config);
    console.log("Reserves are: ", market.reserves);
    let out: ExplicitToken[] = [];
    await Promise.all(market.reserves.filter((x) => {return (new Set(["SOL"])).has(x.config.symbol)}).map(async (x: SolendReserve) => {
        // Do a simple if-statement for the token, match it by the mint
        // if (x.)
        // TODO: Make a lookup later on ...
        // TODO: Figure out how to include logoURIs ... perhaps I should make this in the registry function ...
        // Or as sven said, have a separate object that does this .. but this will introduce circular dependencies
        let logoUri = "https://spl-token-icons.static-assets.ship.capital/icons/101/So11111111111111111111111111111111111111112.png";
        let tmp: ExplicitToken = {
            address: x.config.mintAddress,
            decimals: x.config.decimals,
            logoURI: logoUri,
            name: x.config.name,
            symbol: x.config.symbol
        }
        out.push(tmp);

        // Get the collateral Mint Address
        // TODO: Also add the LP-tokens to this ...
        let tmpLp: ExplicitToken = {
            address: x.config.collateralMintAddress,
            decimals: x.config.decimals,
            logoURI: "https://spl-token-icons.static-assets.ship.capital/icons/101/5h6ssFpeDeRbzsEHDbTQNH7nVGgsKrZydxdSTnLm6QdV.png",
            name: "c" + x.config.symbol,
            // symbol: x.config.symbol
            symbol: "c" + x.config.symbol
        }
        out.push(tmpLp);
    }));
    return out;
}

export const getSolendPools = async (userPubkey: PublicKey): Promise<ExplicitPool[]> => {
    console.log("#getSolendPools()");
    let connection = new Connection("https://api.google.devnet.solana.com");
    const market = await SolendMarket.initialize(connection, "devnet");
    // console.log(market.reserves.map(reserve => reserve.config.loanToValueRatio);
    // console.log("market reserves are: ");
    // console.log(market);
    // console.log("Config is: ", market.config);
    // console.log("Reserves are: ", market.reserves);
    let out: ExplicitPool[] = await Promise.all(market.reserves.filter((x) => {return (new Set(["SOL"])).has(x.config.symbol)}).map(async (x: SolendReserve) => {
        // let logoUri = "https://spl-token-icons.static-assets.ship.capital/icons/101/So11111111111111111111111111111111111111112.png";

        // TODO: Figure out a different way to get the logo for this symbol ...
        // let logoUriUnderlyingToken = await registry.getLogoFromSymbol(x.config.symbol);
        // logoUriUnderlyingToken
        // TODO: Remove these hardcoded items ...
        // Add another type, ExplicitPoolSolend, which also includes the SolendAction with this  ....
        let logoUriLpToken = "https://spl-token-icons.static-assets.ship.capital/icons/101/3JFC4cB56Er45nWVe29Bhnn5GnwQzSmHVf6eUq9ac91h.png";
        let underlyingToken: ExplicitToken = {
            address: x.config.mintAddress,
            decimals: x.config.decimals,
            logoURI: "https://spl-token-icons.static-assets.ship.capital/icons/101/So11111111111111111111111111111111111111112.png",
            name: x.config.name,
            symbol: x.config.symbol
        }
        let lpToken: ExplicitToken = {
            address: x.config.collateralMintAddress,
            decimals: x.config.decimals,
            logoURI: logoUriLpToken,
            name: "Solend" + x.config.name,
            symbol: "c" + x.config.symbol
        }
        console.log("Got this far ....!");
        // I guess we can start the pubkey with something stupid
        // TODO: Basically, once the user connects, we have to rebuild the reserves using the guys' key!
        const solendAction = await SolendAction.initialize(
            "mint",
            new BN(0),
            x.config.symbol,
            userPubkey,
            connection,
            "devnet"
        );
        console.log("But not further ....!");
        let tmp: ExplicitSolendPool = {
            id: "c" + x.config.symbol,
            name: x.config.name,
            lpToken: lpToken,
            protocol: Protocol.solend,
            protocolType: ProtocolType.Lending,
            tokens: [underlyingToken],
            solendAction: solendAction
        }
        return tmp;
    }));
    console.log("Out is: ", out);
    console.log("##getSolendPools()");
    return out;
}
