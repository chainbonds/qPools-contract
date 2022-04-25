"use strict";
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
//import {
//    CrankRpcCalls,
//    MOCK,
//    NETWORK,
//    PortfolioFrontendFriendlyChainedInstructions
//} from "@qpools/sdk";
const web3_js_2 = require("@solana/web3.js");
//import {
//    getSolbondProgram,
//} from "@qpools/sdk";
const utils_1 = require("@qpools/sdk/lib/utils");
const solend_sdk_1 = require("@solendprotocol/solend-sdk");
const sdk_1 = require("@qpools/sdk");
const saber_1 = require("@qpools/sdk/lib/instructions/api/saber");
const pdas_1 = require("@qpools/sdk/lib/types/account/pdas");
const SOLANA_START_AMOUNT = 10000000000;
// interface SyncNativeInstructionData {
//     instruction: TokenInstruction.SyncNative;
// }
// export const syncNativeInstructionData = struct<SyncNativeInstructionData>([u8('instruction')]);
//
// function createSyncNativeInstruction(account: PublicKey, programId = TOKEN_PROGRAM_ID): TransactionInstruction {
//     const keys = [{ pubkey: account, isSigner: false, isWritable: true }];
//
//     const data = Buffer.alloc(syncNativeInstructionData.span);
//     syncNativeInstructionData.encode({ instruction: TokenInstruction.SyncNative }, data);
//
//     return new TransactionInstruction({ keys, programId, data });
// }
describe('qPools!', () => {
    // Configure the client to use the local cluster.
    const provider = anchor_1.Provider.local(process.env.NEXT_PUBLIC_CLUSTER_URL);
    //anchor.setProvider(provider);
    const connection = provider.connection;
    const solbondProgram = (0, sdk_1.getSolbondProgram)(connection, provider, sdk_1.Cluster.DEVNET);
    // @ts-expect-error
    const genericPayer = provider.wallet.payer;
    let weights;
    let USDC_USDT_pubkey;
    let USDC_CASH_pubkey;
    let USDC_TEST_pubkey;
    let poolAddresses;
    let USDC_mint;
    let mSOLLpToken;
    let wrappedSolMint;
    let mSOL;
    let portfolioObject;
    let crankRpcTool;
    let registry;
    let valueInUsdc;
    let AmountUsdc;
    let valueInSol;
    // I guess mSOL has 9 decimal points
    let AmountSol;
    let solendmarket;
    const tokenSymbolSolend = 'SOL';
    let solSolendMint;
    let coinGecoClient;
    // Do some airdrop before we start the tests ...
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        // TODO: For the crank, create a new keypair who runs these cranks ... (as is done on the front-end)
        registry = new sdk_1.Registry(connection);
        coinGecoClient = new sdk_1.CoinGeckoClient(registry);
        portfolioObject = new sdk_1.PortfolioFrontendFriendlyChainedInstructions(connection, provider, solbondProgram, registry);
        yield portfolioObject.initializeState();
        // TODO: Create a new provider for the crank ... (?), and airdrop them some SOL
        // Send some SOL to the tmpKeypair
        let tmpKeypair = web3_js_1.Keypair.generate();
        const sg = yield connection.requestAirdrop(tmpKeypair.publicKey, 500000000);
        const tx = yield connection.confirmTransaction(sg);
        //console.log("airdrop tx: ", tx);
        crankRpcTool = new sdk_1.CrankRpcCalls(connection, tmpKeypair, provider, solbondProgram, registry);
        yield crankRpcTool.initializeState();
        // Delay a bit so the async call works ...
        yield (0, utils_1.delay)(5000);
        weights = [new anchor_1.BN(500), new anchor_1.BN(500), new anchor_1.BN(500)];
        USDC_mint = new web3_js_1.PublicKey("2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8");
        // USDC_USDT_pubkey = new PublicKey("VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL");  // This is the pool address, not the LP token ...
        USDC_USDT_pubkey = new web3_js_1.PublicKey("YakofBo4X3zMxa823THQJwZ8QeoU8pxPdFdxJs7JW57");
        mSOLLpToken = new web3_js_1.PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"); // Assume the LP token to be the denominator for what underlying asset we target ...
        // Todo, wrap some SOL and send this to the account ...
        // let USDC_mint = new PublicKey("2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8");
        wrappedSolMint = new web3_js_1.PublicKey("So11111111111111111111111111111111111111112");
        solendmarket = yield solend_sdk_1.SolendMarket.initialize(connection, "devnet");
        yield solendmarket.loadReserves();
        const solReserve = solendmarket.reserves.find(res => res.config.symbol === tokenSymbolSolend);
        solSolendMint = new web3_js_1.PublicKey(solReserve.config.mintAddress);
        //console.log("Solend Sol Mint Address is: ", solSolendMint.toString());
        // We need the mSOL, because in the end, this is what we will be sendin back to the user ...
        // We will probably need to apply a hack, where we replace the mSOL with SOL, bcs devnet.
        // Probably easiest to do so is by swapping on the frontend, once we are mainnet ready
        mSOL = portfolioObject.marinadeState.mSolMintAddress;
        //console.log("mSOL mint is: ", mSOL.toString());
        poolAddresses = [USDC_USDT_pubkey, mSOLLpToken, solSolendMint];
        // If poolAddresses or weights are empty, don't proceed!
        if (weights.length === 0 || poolAddresses.length === 0) {
            throw Error("Weights or PoolAddresses are empty!");
        }
        if (weights.length != poolAddresses.length) {
            throw Error("Weights and PoolAddresses do not conform!");
        }
        if (!(weights.length > 0)) {
            throw Error("All weights are zero! Doesn't make sense to create a portfolio");
        }
    }));
    it("Create Associated Token Accounts", () => __awaiter(void 0, void 0, void 0, function* () {
        //console.log("Creating associated token accounts ...");
        // solSolendMint
        // Fetch solend, and the other currencies that we are using ...
        //console.log("Creating associated token addresses for: ", [poolAddresses].map((x) => x.toString()));
        // get the mint addresses
        // This is the token mint for the USDC-USDT pool
        let txCreateATA = yield portfolioObject.createAssociatedTokenAccounts(poolAddresses, provider.wallet);
        if (txCreateATA.instructions.length > 0) {
            //console.log("Transaction is: ", txCreateATA);
            yield (0, utils_1.sendAndConfirmTransaction)(solbondProgram.provider, connection, txCreateATA);
        }
        //console.log("Airdropping some wrapped SOL");
        // create a wrapped SOL account
        if ((yield connection.getBalance(genericPayer.publicKey)) <= 3e9) {
            let tx1 = yield connection.requestAirdrop(genericPayer.publicKey, 3e9);
            yield connection.confirmTransaction(tx1, 'finalized');
            //console.log("Airdropped 1!");
        }
        // If it exists, skip this.
        const associatedTokenAccountWrappedSol = yield (0, sdk_1.getAssociatedTokenAddressOffCurve)(wrappedSolMint, genericPayer.publicKey);
        const givemoney = new web3_js_2.Transaction().add(web3_js_1.SystemProgram.transfer({
            fromPubkey: genericPayer.publicKey,
            toPubkey: associatedTokenAccountWrappedSol,
            lamports: 4e8,
        }), 
        // createSyncNativeInstruction(associatedTokenAccountWrappedSol)
        (0, solend_sdk_1.syncNative)(associatedTokenAccountWrappedSol));
        let sendsig = yield provider.send(givemoney);
        yield provider.connection.confirmTransaction(sendsig);
        //console.log("send money from user to portfolio: ", sendsig);
    }));
    it("Prepare the amount of SOL and USDC to pay in ", () => __awaiter(void 0, void 0, void 0, function* () {
        valueInUsdc = 2;
        AmountUsdc = new anchor_1.BN(valueInUsdc).mul(new anchor_1.BN(Math.pow(10, sdk_1.MOCK.DEV.SABER_USDC_DECIMALS)));
        valueInSol = 2;
        // I guess mSOL has 9 decimal points
        AmountSol = new anchor_1.BN(valueInSol).mul(new anchor_1.BN(Math.pow(10, 9)));
        //console.log("Total amount in Usdc is: ", valueInUsdc);
        if (!(valueInUsdc > 0)) {
            throw Error("Amount to be paid in must be bigger than 0");
        }
    }));
    it("Creates the first transaction", () => __awaiter(void 0, void 0, void 0, function* () {
        let tx = new web3_js_2.Transaction();
        // hardcode this for now lol
        //console.log("createPortfolioSigned");
        let IxCreatePortfolioPda = yield portfolioObject.createPortfolioSigned(weights, poolAddresses, new anchor_1.BN(2));
        tx.add(IxCreatePortfolioPda);
        //console.log("Transfer Asset to Portfolio");
        //console.log("registerCurrencyInputInPortfolio");
        let IxRegisterCurrencyUsdcInput = yield portfolioObject.registerCurrencyInputInPortfolio(AmountUsdc, USDC_mint);
        tx.add(IxRegisterCurrencyUsdcInput);
        //console.log("registerCurrencyInputInPortfolio");
        let IxRegisterCurrencywSOLInput = yield portfolioObject.registerCurrencyInputInPortfolio(new anchor_1.BN(1).mul(new anchor_1.BN(Math.pow(10, 9))), solSolendMint);
        tx.add(IxRegisterCurrencywSOLInput);
        // let IxRegisterCurrencyMSolInput = await qPoolContext.portfolioObject!.registerCurrencyInputInPortfolio(
        //     AmountSol, wrappedSolMint
        // );
        // tx.add(IxRegisterCurrencyMSolInput);
        // Set of instructions here are hard-coded
        // Create position approve for marinade, and the saber pool (again, hardcode this part lol).
        // Later these should be fetched from the frontend.
        //console.log("Approve Position Saber");
        // I guess we gotta make the case distinction here lol
        // TODO: Copy the case-distinction from below. Then you can continue
        // TODO: figure out tokenA and tokenB ==> Currently hard-coded...
        //console.log("approvePositionWeightSaber");
        let IxApproveiPositionWeightSaber = yield portfolioObject.approvePositionWeightSaber(poolAddresses[0], AmountUsdc, new anchor_1.BN(0), // Will be flipped in the backend ..
        new anchor_1.BN(0), 0, // Hardcoded
        weights[0]);
        tx.add(IxApproveiPositionWeightSaber);
        //console.log("Approve Position Marinade");
        //console.log("approvePositionWeightMarinade");
        let IxApprovePositionWeightMarinade = yield portfolioObject.approvePositionWeightMarinade(new anchor_1.BN(1).mul(new anchor_1.BN(Math.pow(10, 6))), 1, // Hardcoded
        weights[1]);
        tx.add(IxApprovePositionWeightMarinade);
        //console.log("Approve Position Solend");
        let IxApprovePositionWeightSolend = yield portfolioObject.approvePositionWeightSolend(solSolendMint, new anchor_1.BN(1).mul(new anchor_1.BN(Math.pow(10, 5))), 2, // Hardcoded
        weights[2]);
        tx.add(IxApprovePositionWeightSolend);
        //console.log("Sending USDC");
        let IxSendUsdcToPortfolio = yield portfolioObject.transfer_to_portfolio(USDC_mint);
        let IxSendSolendSoltoPortfolio = yield portfolioObject.transfer_to_portfolio(solSolendMint);
        tx.add(IxSendUsdcToPortfolio);
        tx.add(IxSendSolendSoltoPortfolio);
        // For now, we can make the generic payer also run the cranks, so we can skip the crank wallet functionality ...
        //console.log("Sending and signing the transaction");
        //console.log("Provider is: ");
        //console.log(solbondProgram!.provider);
        //console.log(solbondProgram!.provider.wallet.publicKey.toString());
        yield (0, utils_1.sendAndConfirmTransaction)(solbondProgram.provider, connection, tx);
    }));
    it("run the cranks to fulfill the Saber, Marinade and solend Positions ...", () => __awaiter(void 0, void 0, void 0, function* () {
        // These are not instruction-chained, because the crankRPC is done through a keypair ...
        // Perhaps it could be useful to make it chained tho, just for the sake of atomicity
        let sgPermissionlessFullfillSaber = yield crankRpcTool.permissionlessFulfillSaber(0);
        //console.log("Fulfilled sg Saber is: ", sgPermissionlessFullfillSaber);
        let sgPermissionlessFullfillMarinade = yield crankRpcTool.createPositionMarinade(1);
        //console.log("Fulfilled sg Marinade is: ", sgPermissionlessFullfillMarinade);
        let solendAction = yield solend_sdk_1.SolendAction.initialize("mint", new anchor_1.BN(0), tokenSymbolSolend, provider.wallet.publicKey, connection, "devnet");
        let sgPermissionlessFullfillSolend = yield crankRpcTool.createPositionSolend(2);
        //console.log("Fulfilled sg Solend is: ", sgPermissionlessFullfillSolend);
    }));
    it("get Saber Token value", () => __awaiter(void 0, void 0, void 0, function* () {
        let [ataLP, bumpATAlp] = yield (0, pdas_1.getATAPda)(provider.wallet.publicKey, poolAddresses[0], solbondProgram);
        let lpTokenAmount = yield connection.getBalance(ataLP);
        let exchangeRate = (0, saber_1.saberPoolTokenPrice)(connection, poolAddresses[0], registry, coinGecoClient);
        console.log("EXCHANGE RATE : ", exchangeRate);
        let value = (0, saber_1.saberMultiplyAmountByUSDPrice)(lpTokenAmount, poolAddresses[0], connection, registry, coinGecoClient);
        console.log("VALUE OF SABER LP TOKEN : ", value);
    }));
    /**
     * Now also redeem the positions ...
     */
    it("start to withdraw the position again: ", () => __awaiter(void 0, void 0, void 0, function* () {
        let tx = new web3_js_2.Transaction();
        //console.log("Approving Withdraw Portfolio");
        let IxApproveWithdrawPortfolio = yield portfolioObject.approveWithdrawPortfolio();
        tx.add(IxApproveWithdrawPortfolio);
        //console.log("Approving Saber Withdraw");
        // TODO: Check which of the tokens is tokenA, and withdraw accordingly ...
        let minRedeemAmount = new anchor_1.BN(0); // This is the minimum amount of tokens that should be put out ...
        let IxApproveWithdrawSaber = yield portfolioObject.signApproveWithdrawAmountSaber(0, minRedeemAmount);
        tx.add(IxApproveWithdrawSaber);
        //console.log("Approving Marinade Withdraw");
        let IxApproveWithdrawMarinade = yield portfolioObject.approveWithdrawToMarinade(1);
        tx.add(IxApproveWithdrawMarinade);
        // let minRedeemAmount2 = new BN(1).mul(new BN(10**4));  // This is the minimum amount of tokens that should be put out ...
        let IxApproveWithdrawSolend = yield portfolioObject.approveWithdrawSolend(2);
        tx.add(IxApproveWithdrawSolend);
        //console.log("Send some to Crank Wallet");
        if (tx.instructions.length > 0) {
            yield (0, utils_1.sendAndConfirmTransaction)(solbondProgram.provider, connection, tx);
        }
    }));
    it("run the cranks to send the assets back to the user", () => __awaiter(void 0, void 0, void 0, function* () {
        // Run the saber redeem cranks ..
        let sgRedeemSinglePositionOnlyOne = yield crankRpcTool.redeem_single_position_only_one(0);
        //console.log("Signature to run the crank to get back USDC is: ", sgRedeemSinglePositionOnlyOne);
        let sgPermissionlessFullfillSolend = yield crankRpcTool.redeemPositionSolend(2);
        //console.log("Redeem sg Solend is: ", sgPermissionlessFullfillSolend)
        // For each initial asset, send it back to the user
        let sgTransferUsdcToUser = yield crankRpcTool.transfer_to_user(USDC_mint);
        //console.log("Signature to send back USDC", sgTransferUsdcToUser);
        let sgTransferUsdcTosolendSol = yield crankRpcTool.transfer_to_user(solSolendMint);
        //console.log("Signature to send back wSOL", sgTransferUsdcTosolendSol);
        // We never transferred wrapped sol ...
        // let sgTransferWrappedSolToUser = await crankRpcTool.transfer_to_user(wrappedSolMint);
        // console.log("Signature to send back Wrapped SOL", sgTransferWrappedSolToUser);
        // As for marinade SOL, it is transferred in the same moment as it is approved. As it is approved, this account is deleted.
        // So there is no need to (in fact, you cannot), transfer it back
        // let sgTransferMarinadeSolToUser = await crankRpcTool.transfer_to_user(mSOL);
        // console.log("Signature to send back Marinade SOL", sgTransferMarinadeSolToUser);
        // In reality, you would also swap back the mSOL to SOL ...
    }));
});
