// /**
//  * Script to generate the token lists and the pool lists
//  *
//  * We assume that every pool has an LP token.
//  * This is not true in practice, but we again can have an aritificial LP token per protocol
//  *
//  */
// import {registry} from "../index";
// import axios from "axios";
// import * as stream from "stream";
//
// // Load the SPL token variable in a constant early on here (as a global)
// const saberTokenRegistryLink: string = "https://registry.saber.so/data/token-list.devnet.json";
// const solendLink: string = "https://api.solend.fi/v1/config/?deployment=devnet";
//
//
// // Can also do something similar for getTokenMintToLogoUrl
// interface SplToken {
//     address: string,
//     chainId: null,
//     decimals: null,
//     logoURI: string,
//     name: string,
//     symbol: string
// };
// const getAllSplTokens = async (): Promise<SplToken[]> => {
//     let response = await axios.get<any>(saberTokenRegistryLink);
//     let tokens: SplToken[] = response.data["tokens"];
//     return tokens;
// }
//
//
// /**
//  * Take the Token List from the SPL Library, and append it by pyth oracles
//  */
// const createTokenList = async (): Promise<registry.ExplicitToken[]> => {
//     // Call all individual token lists, and make them generate these ones
//     return await createTokenListSolend();
//     // let tokenListMarinade = await createTokenListMarinade();
//     // let tokenListSaber = await createTokenListSaber();
//     // return [...tokenListMarinade, ...tokenListSaber, ...tokenListSolend];
//     // return tokenListSolend;
// }
//
// interface SolendTokenAsset {
//     name: string,
//     symbol: string,
//     decimals: null,
//     mintAddress: string
// };
// const createTokenListSolend = async (): Promise<registry.ExplicitToken[]> => {
//     let response = await axios.get<any>(solendLink);
//     // console.log("Response is: ", response.data);
//     let assets: SolendTokenAsset[] = response.data["assets"];
//     console.log("Assets are: ", assets);
//
//     let tokens: registry.ExplicitToken[] = [];
//     // For each of the assets, get the specific information on it as well ....
//     // And just start population the servers
//     let allSplTokens: SplToken[] = await getAllSplTokens();
//     assets.filter((x: SolendTokenAsset) => {return new Set(["USDC", "SOL"]).has(x.symbol)}).map((x: SolendTokenAsset) => {
//         // Depending on mainnet or devnet, filter on name or address
//         // let logoUri = allSplTokens.filter((y: SplToken) => y.address === x.mintAddress)[0].logoURI;
//         console.log("Skip the tokens if they dont fit");
//         console.log(x);
//         console.log("All SplTokens are: ", allSplTokens);
//         let matchingSplTokenObject: SplToken[] = allSplTokens.filter((y: SplToken) => y.symbol == x.symbol);
//         console.log("matching SPL Token object: ", matchingSplTokenObject);
//         // let logoUri: string = matchingSplTokenObject.logoURI;
//         // // Fetch the logoURI by calling a similar-looking token ...
//         // let out: registry.ExplicitToken = {
//         //     address: x.mintAddress,
//         //     decimals: x.decimals,
//         //     logoURI: logoUri,
//         //     name: x.name,
//         //     symbol: x.symbol
//         // }
//         // return out;
//     });
//     return tokens;
// }
//
// // const poolUrl = "https://api.solend.fi/v1/reserves/?ids=";
//
// // /**
// //  * We create a new artificial token list for marinade, which includes "native SOL"
// //  */
// //
// // const createTokenListMarinade = async (): Promise<registry.ExplicitToken[]> => {
// //
// // }
// //
// // /**
// //  * This is literally the SPL token list. We can just take it from there
// //  */
// // const createTokenListSaber = async (): Promise<registry.ExplicitToken[]> => {
// //
// // }
// //
// // /**
// //  * Take the Pool List from
// //  */
// // const createPoolList = () => {
// //
// // }
// //
// // const createPoolListSolend = () => {
// //
// // }
// //
// // const createPoolListMarinade = () => {
// //
// // }
// //
// // /**
// //  * Mostly take the tokens from the saber directory
// //  */
// // const createPoolListSaber = () => {
// //
// // }
//
// // createTokenList()
// // console.log();