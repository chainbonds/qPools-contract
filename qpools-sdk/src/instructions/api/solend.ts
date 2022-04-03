/**
 * Probably could also just use the SDK to get the tokens
 *
 * TODO: Modify this file to account for distinction between devnet and testnet
 *  Replace the LogoFromSymbol with LogoFromMint for Mainnet ...
 */

import {ExplicitPool, ExplicitToken, getLogoFromMint, getLogoFromSymbol} from "../../registry/registry-helper";
import {SolendMarket, SolendReserve} from "@solendprotocol/solend-sdk";
import {Connection} from "@solana/web3.js";
import {Protocol, ProtocolType} from "../../index";


export const getSolendTokens = async (): Promise<ExplicitToken[]> => {
    let devnet = true;
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
        let logoUri = "https://spl-token-icons.static-assets.ship.capital/icons/101/So11111111111111111111111111111111111111112.png";
        let logoUriUnderlyingToken = await getLogoFromSymbol(x.config.symbol);
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
            symbol: x.config.symbol
        }
        out.push(tmpLp);
    }));
    return out;
}

export const getSolendPools = async (): Promise<ExplicitPool[]> => {
    let devnet = true;
    let connection = new Connection("https://api.google.devnet.solana.com");
    const market = await SolendMarket.initialize(connection, "devnet");
    // console.log(market.reserves.map(reserve => reserve.config.loanToValueRatio);
    // console.log("market reserves are: ");
    // console.log(market);
    // console.log("Config is: ", market.config);
    // console.log("Reserves are: ", market.reserves);
    let out: ExplicitPool[] = await Promise.all(market.reserves.filter((x) => {return (new Set(["SOL"])).has(x.config.symbol)}).map(async (x: SolendReserve) => {
        // let logoUri = "https://spl-token-icons.static-assets.ship.capital/icons/101/So11111111111111111111111111111111111111112.png";
        let logoUriUnderlyingToken = await getLogoFromSymbol(x.config.symbol);
        let logoUriLpToken = "https://spl-token-icons.static-assets.ship.capital/icons/101/3JFC4cB56Er45nWVe29Bhnn5GnwQzSmHVf6eUq9ac91h.png";
        let underlyingToken: ExplicitToken = {
            address: x.config.mintAddress,
            decimals: x.config.decimals,
            logoURI: logoUriUnderlyingToken,
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
        let tmp: ExplicitPool = {
            id: "c" + x.config.symbol,
            name: x.config.name,
            lpToken: lpToken,
            protocol: Protocol.solend,
            protocolType: ProtocolType.Lending,
            tokens: [underlyingToken]
        }
        return tmp;
    }));
    console.log("Out is: ", out);
    return out;
}
