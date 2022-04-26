"use strict";
/**
 * Test to test all functionality of the invariant program that we have here
 *
 * This includes the following functionality in this order
 * - create pool
 * - provide liquidity
 * - make a trade as a third party
 * - claim fees
 * - close position
 *
 * Some functionality will deviate between devnet and localnet, thus we have created two different tests
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const anchor_1 = require("@project-serum/anchor");
const web3_js_1 = require("@solana/web3.js");
const sdk_1 = require("@qpools/sdk");
const cluster_1 = require("@qpools/sdk/lib/cluster");
const spl_token_1 = require("@solana/spl-token");
const chai_1 = require("chai");
const saber = __importStar(require("@saberhq/stableswap-sdk"));
const stableswap_sdk_1 = require("@saberhq/stableswap-sdk");
const utils_1 = require("@qpools/sdk/lib/utils");
describe('saber-devnet', () => {
    // Get connection and provider
    const provider = anchor_1.Provider.local("https://api.devnet.solana.com
");
    const connection = provider.connection;
    // @ts-expect-error
    const genericPayer = provider.wallet.payer;
    const genericWallet = provider.wallet;
    const mintAuthority = genericPayer;
    // Generate the users
    const trader = web3_js_1.Keypair.fromSecretKey(Uint8Array.from([
        174, 47, 154, 16, 202, 193, 206, 113, 199, 190, 53, 133, 169, 175, 31, 56, 222, 53, 138, 189, 224, 216, 117,
        173, 10, 149, 53, 45, 73, 251, 237, 246, 15, 185, 186, 82, 177, 240, 148, 69, 241, 227, 167, 80, 141, 89, 240,
        121, 121, 35, 172, 247, 68, 251, 226, 218, 48, 63, 176, 109, 168, 89, 238, 135,
    ]));
    const liquidityProvider = web3_js_1.Keypair.fromSecretKey(Uint8Array.from([
        142, 174, 4, 30, 129, 117, 122, 31, 65, 41, 23, 143, 217, 24, 76, 91, 223, 235, 147, 214, 252, 84, 129, 117,
        137, 22, 221, 247, 75, 98, 237, 134, 123, 245, 172, 72, 24, 213, 209, 2, 129, 212, 96, 132, 156, 125, 171, 198,
        177, 63, 175, 223, 101, 214, 5, 139, 2, 80, 74, 115, 41, 224, 31, 59
    ]));
    const currencyOwner = sdk_1.airdropAdmin;
    const solbondProgram = (0, sdk_1.getSolbondProgram)(connection, provider, cluster_1.NETWORK.DEVNET);
    console.log("Solbond Program");
    console.log(solbondProgram.programId.toString());
    let market;
    let currencyMint;
    /** Get a bunch of airdrops to pay for transactions */
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        // Airdrop stuff, if no balance is found ..
        // Request airdrops for all accounts that will be active
        if ((yield connection.getBalance(trader.publicKey)) <= 2e9) {
            let tx1 = yield connection.requestAirdrop(trader.publicKey, 2e9);
            yield connection.confirmTransaction(tx1, 'finalized');
            console.log("Airdropped 1!");
        }
        if ((yield connection.getBalance(liquidityProvider.publicKey)) <= 2e9) {
            let tx2 = yield connection.requestAirdrop(liquidityProvider.publicKey, 2e9);
            yield connection.confirmTransaction(tx2, 'finalized');
            console.log("Airdropped 2!");
        }
        if ((yield connection.getBalance(currencyOwner.publicKey)) <= 2e9) {
            let tx3 = yield connection.requestAirdrop(currencyOwner.publicKey, 2e9);
            yield connection.confirmTransaction(tx3, 'finalized');
            console.log("Airdropped 3!");
        }
        // Maybe need to add delay. check if it works, and do it accordingly
        let traderBalance = yield provider.connection.getBalance(trader.publicKey);
        let liquidityProviderBalance = yield provider.connection.getBalance(liquidityProvider.publicKey);
        let currencyOwnerBalance = yield provider.connection.getBalance(currencyOwner.publicKey);
        chai_1.assert.ok(traderBalance > 2e9, "1 " + String(traderBalance));
        chai_1.assert.ok(liquidityProviderBalance > 2e9, "2 " + String(liquidityProviderBalance));
        chai_1.assert.ok(currencyOwnerBalance > 2e9, "3 " + String(currencyOwnerBalance));
    }));
    /** Assign the currency mint */
    it("#createCurrencyMint", () => __awaiter(void 0, void 0, void 0, function* () {
        chai_1.assert.ok(solbondProgram.programId, String(solbondProgram.programId));
        // Take the currency mint from the user SDK
        currencyMint = new spl_token_1.Token(connection, sdk_1.MOCK.DEV.SABER_USDC, solbondProgram.programId, currencyOwner);
        chai_1.assert.ok(currencyMint.publicKey.equals(sdk_1.MOCK.DEV.SABER_USDC), currencyMint.publicKey.toString());
    }));
    // All token accounts
    let allSwapAccounts = [
        sdk_1.MOCK.DEV.SABER_POOL.USDC_USDT,
        sdk_1.MOCK.DEV.SABER_POOL.USDC_CASH,
        sdk_1.MOCK.DEV.SABER_POOL.USDC_PAI,
        sdk_1.MOCK.DEV.SABER_POOL.USDC_TEST
    ];
    // Replace this by a forloop for all pools later
    let swapAccount = new web3_js_1.PublicKey(allSwapAccounts[0]);
    // TODO: Assume USDC<->USDT Swaps!
    // TODO: I hardcode the qpt contract here, but should prob use the admin SDK to retrieve the respective address!
    // Or create the respective address ...
    // let qPoolAccount: PublicKey = new PublicKey("7JpdFrdigDtzM1r6mnKXNS645dDKTKwkz2waF2HUJoVT");
    let qPoolAccount = new web3_js_1.PublicKey("DiPga2spUbnyY8vJVZUYaeXcosEAuXnzx9EzuKuUaSxs");
    let userUsdtAccount;
    let currencyAccount;
    let stableSwap;
    let poolUserAccount;
    it("#loadsSaber()", () => __awaiter(void 0, void 0, void 0, function* () {
        // Assume we have a bunch of USDC
        currencyMint = new spl_token_1.Token(connection, sdk_1.MOCK.DEV.SABER_USDC, solbondProgram.programId, genericPayer);
        // Load the stableSwap program
        stableSwap = yield stableswap_sdk_1.StableSwap.load(connection, swapAccount, stableswap_sdk_1.SWAP_PROGRAM_ID);
        // Should be BvRsZMznoYKzgZ2XxHRjbkFGoRUSGJvns4Csc4pBsHSR
        // for out local account DiPga2spUbnyY8vJVZUYaeXcosEAuXnzx9EzuKuUaSxs
        currencyAccount = yield (0, sdk_1.getAssociatedTokenAddressOffCurve)(sdk_1.MOCK.DEV.SABER_USDC, qPoolAccount);
        // Create the associated token accounts for the target currencies if these don't exist yet
        // Gotta create a USDT associated token account
        try {
            let tx = yield (0, sdk_1.createAssociatedTokenAccountUnsigned)(connection, sdk_1.MOCK.DEV.SABER_USDT, null, qPoolAccount, provider.wallet);
            const sg = yield connection.sendTransaction(tx, [genericPayer]);
            yield connection.confirmTransaction(sg);
            console.log("Signature is: ", sg);
        }
        catch (e) {
            console.log("Error is: ");
            console.log(e);
        }
        userUsdtAccount = yield (0, sdk_1.getAssociatedTokenAddressOffCurve)(sdk_1.MOCK.DEV.SABER_USDT, qPoolAccount);
        try {
            let tx = yield (0, sdk_1.createAssociatedTokenAccountUnsigned)(connection, stableSwap.state.poolTokenMint, null, qPoolAccount, provider.wallet);
            const sg = yield connection.sendTransaction(tx, [genericPayer]);
            yield connection.confirmTransaction(sg);
            console.log("Signature is: ", sg);
        }
        catch (e) {
            console.log("Error is: ");
            console.log(e);
        }
        poolUserAccount = yield (0, sdk_1.getAssociatedTokenAddressOffCurve)(stableSwap.state.poolTokenMint, qPoolAccount);
        console.log("Source account is: ", currencyAccount.toString());
    }));
    it("#makeSwap()", () => __awaiter(void 0, void 0, void 0, function* () {
        let tx = new web3_js_1.Transaction();
        // TODO: Obviously we cannot do this, because the qPoolAccount is a PDA,
        //  and we cannot do logic on behalf of a PDA in a TS test
        console.log("Tokens A and B are: ");
        console.log(stableSwap.state.tokenA.mint.toString());
        console.log(stableSwap.state.tokenB.mint.toString());
        // How do I know which one is tokenA and which one is tokenB
        let swapIx = {
            config: stableSwap.config,
            adminDestination: stableSwap.state.tokenB.adminFeeAccount,
            amountIn: (0, utils_1.tou64)(50),
            minimumAmountOut: (0, utils_1.tou64)(30),
            // Or are these the fee-accounts?
            poolSource: stableSwap.state.tokenA.reserve,
            poolDestination: stableSwap.state.tokenB.reserve,
            userAuthority: qPoolAccount,
            userDestination: userUsdtAccount,
            userSource: currencyAccount
        };
        let swapTx = yield saber.swapInstruction(swapIx);
        tx = tx.add(swapTx);
        const sg = yield connection.sendTransaction(tx, [genericPayer]);
        yield connection.confirmTransaction(sg);
    }));
    it("#depsitsToTheSaberPools()", () => __awaiter(void 0, void 0, void 0, function* () {
        // Solana get how many USDC is provided ...
        let tx = new web3_js_1.Transaction();
        let depositIx = {
            config: stableSwap.config,
            userAuthority: qPoolAccount,
            // What is Token A and Token B, does the order matter?
            sourceA: currencyAccount,
            sourceB: userUsdtAccount,
            tokenAccountA: stableSwap.state.tokenA.reserve,
            tokenAccountB: stableSwap.state.tokenB.reserve,
            poolTokenMint: stableSwap.state.poolTokenMint,
            // User
            poolTokenAccount: poolUserAccount,
            // Provide these in an equal ratio ...
            tokenAmountA: (0, utils_1.tou64)(10),
            tokenAmountB: (0, utils_1.tou64)(10),
            minimumPoolTokenAmount: (0, utils_1.tou64)(3)
        };
        let swapTx = yield saber.depositInstruction(depositIx);
        tx = tx.add(swapTx);
        const sg = yield connection.sendTransaction(tx, [genericPayer]);
        yield connection.confirmTransaction(sg);
    }));
    it("#withdrawFromTheSaberPools()", () => __awaiter(void 0, void 0, void 0, function* () {
        let tx = new web3_js_1.Transaction();
        let withdrawIx = {
            config: stableSwap.config,
            userAuthority: qPoolAccount,
            poolMint: stableSwap.state.poolTokenMint,
            tokenAccountA: stableSwap.state.tokenA.reserve,
            tokenAccountB: stableSwap.state.tokenB.reserve,
            // what are these?
            adminFeeAccountA: stableSwap.state.tokenA.adminFeeAccount,
            adminFeeAccountB: stableSwap.state.tokenB.adminFeeAccount,
            sourceAccount: poolUserAccount,
            userAccountA: currencyAccount,
            userAccountB: userUsdtAccount,
            poolTokenAmount: (0, utils_1.tou64)(10),
            minimumTokenA: (0, utils_1.tou64)(3),
            minimumTokenB: (0, utils_1.tou64)(3),
        };
        let swapTx = saber.withdrawInstruction(withdrawIx);
        tx = tx.add(swapTx);
        const sg = yield connection.sendTransaction(tx, [genericPayer]);
        yield connection.confirmTransaction(sg);
    }));
    // Actually, not even sure if this is needed at all
    let stateAddress;
    let stateAddressBump;
});
