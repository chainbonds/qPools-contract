"use strict";
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
exports.QPoolsAdmin = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@project-serum/anchor");
const anchor = __importStar(require("@project-serum/anchor"));
const sdk_1 = require("@invariant-labs/sdk");
const spl_token_1 = require("@solana/spl-token");
const utils_1 = require("@invariant-labs/sdk/lib/utils");
const chai_1 = require("chai");
const math_1 = require("@invariant-labs/sdk/lib/math");
const invariant_program_1 = require("./invariant-program");
const associated_token_account_1 = require("easy-spl/dist/tx/associated-token-account");
// @ts-ignore
const sdk_2 = require("@qpools/sdk");
// import {
//     BondPoolAccount,
//     createAssociatedTokenAccountSendUnsigned, createAssociatedTokenAccountUnsigned,
//     createMint,
//     getSolbondProgram
// } from "@qpools/sdk/lib/qpools-sdk/src";
// import {
//     BondPoolAccount,
//     createAssociatedTokenAccountSendUnsigned,
//     createMint,
//     getSolbondProgram
// } from "@qpools/sdk/lib/src";
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
class QPoolsAdmin {
    constructor(connection, provider, currencyMint) {
        // All tokens owned by the protocol
        this.qPoolAccount = null; // qPool Account
        this.bumpQPoolAccount = null;
        this.QPReserveTokens = {};
        this.connection = connection;
        this.solbondProgram = (0, sdk_2.getSolbondProgram)(connection, provider); // anchor.workspace.Solbond;
        this.invariantProgram = (0, invariant_program_1.getInvariantProgram)(connection, provider);
        // this.invariantProgram = anchor.workspace.Amm as Program;  //  as Program<Amm>;
        this.provider = provider;
        // @ts-expect-error
        this.wallet = provider.wallet.payer;
        // Assert that currencyMint is truly a mint
        this.currencyMint = new spl_token_1.Token(this.connection, currencyMint, this.solbondProgram.programId, this.wallet);
        this.feeTier = {
            fee: (0, utils_1.fromFee)(new anchor_1.BN(600)),
            tickSpacing: 10
        };
        // Do a bunch of assert OKs
    }
    prettyPrintAccounts() {
        console.log("solbondProgram", this.solbondProgram.programId.toString());
        console.log("invariantProgram", this.invariantProgram.programId.toString());
        console.log("wallet", this.wallet.publicKey.toString());
        console.log("🟢 qPoolAccount", this.qPoolAccount.toString());
        console.log("🟢 bumpQPoolAccount", this.bumpQPoolAccount.toString());
        console.log("🌊 QPTokenMint", this.QPTokenMint.publicKey.toString());
        console.log("🌊 qPoolQPAccount", this.qPoolQPAccount.toString());
        console.log("💵 currencyMint", this.currencyMint.publicKey.toString());
        console.log("💵 qPoolCurrencyAccount", this.qPoolCurrencyAccount.toString());
    }
    loadExistingQPTReserve() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Fetching QPT reserve...");
            [this.qPoolAccount, this.bumpQPoolAccount] = yield web3_js_1.PublicKey.findProgramAddress([this.currencyMint.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("bondPoolAccount1"))], this.solbondProgram.programId);
            // Get the token account
            let bondPoolAccount;
            try {
                bondPoolAccount = (yield this.solbondProgram.account.bondPoolAccount.fetch(this.qPoolAccount));
            }
            catch (error) {
                console.log("Couldn't catch bondPoolAccount");
                console.log(JSON.stringify(error));
                console.log(error);
                return false;
            }
            if (!bondPoolAccount) {
                return false;
            }
            // Check if this is empty.
            // If empty, return false
            this.currencyMint = new spl_token_1.Token(this.connection, bondPoolAccount.bondPoolCurrencyTokenMint, this.solbondProgram.programId, this.wallet);
            this.QPTokenMint = new spl_token_1.Token(this.connection, bondPoolAccount.bondPoolRedeemableMint, this.solbondProgram.programId, this.wallet);
            this.qPoolQPAccount = bondPoolAccount.bondPoolRedeemableTokenAccount;
            this.qPoolCurrencyAccount = bondPoolAccount.bondPoolCurrencyTokenAccount;
            return true;
        });
    }
    initializeQPTReserve() {
        return __awaiter(this, void 0, void 0, function* () {
            // Currency mint should be part of the PDA
            // Generate qPoolAccount
            console.log("BEGIN: initializeQPTReserve");
            [this.qPoolAccount, this.bumpQPoolAccount] = yield web3_js_1.PublicKey.findProgramAddress([this.currencyMint.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("bondPoolAccount1"))], this.solbondProgram.programId);
            this.QPTokenMint = yield (0, sdk_2.createMint)(this.provider, this.wallet, this.qPoolAccount, 9);
            yield delay(1000);
            this.qPoolQPAccount = yield (0, sdk_2.createAssociatedTokenAccountSendUnsigned)(this.connection, this.QPTokenMint.publicKey, this.qPoolAccount, this.provider.wallet);
            this.qPoolCurrencyAccount = yield (0, sdk_2.createAssociatedTokenAccountSendUnsigned)(this.connection, this.currencyMint.publicKey, this.qPoolAccount, this.provider.wallet);
            /* Now make the RPC call, to initialize a qPool */
            const initializeTx = yield this.solbondProgram.rpc.initializeBondPool(this.bumpQPoolAccount, {
                accounts: {
                    bondPoolAccount: this.qPoolAccount,
                    bondPoolRedeemableMint: this.QPTokenMint.publicKey,
                    bondPoolCurrencyTokenMint: this.currencyMint.publicKey,
                    bondPoolRedeemableTokenAccount: this.qPoolQPAccount,
                    bondPoolCurrencyTokenAccount: this.qPoolCurrencyAccount,
                    initializer: this.wallet.publicKey,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: anchor_1.web3.SYSVAR_CLOCK_PUBKEY,
                    systemProgram: anchor_1.web3.SystemProgram.programId,
                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID
                },
                signers: [this.wallet]
            });
            yield this.provider.connection.confirmTransaction(initializeTx);
            console.log("END: initializeQPTReserve");
            // TODO: Do a bunch of asserts?
        });
    }
    /**
     *
     * @param currencyMint: Will be provided, is the currency that will be used
     */
    get(pair) {
        return __awaiter(this, void 0, void 0, function* () {
            const address = yield pair.getAddress(this.invariantProgram.programId);
            return (yield this.invariantProgram.account.pool.fetch(address));
        });
    }
    createQPTReservePoolAccounts(positionOwner, payer) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this.pairs.map((pair) => __awaiter(this, void 0, void 0, function* () {
                const tokenX = new spl_token_1.Token(this.connection, pair.tokenX, spl_token_1.TOKEN_PROGRAM_ID, positionOwner);
                const tokenY = new spl_token_1.Token(this.connection, pair.tokenY, spl_token_1.TOKEN_PROGRAM_ID, positionOwner);
                // TODO: Implement
                // Create qPool Accounts as a side-products.
                // I think these should be done somewhere separate!
                yield (0, associated_token_account_1.createAssociatedTokenAccountSend)(this.connection, tokenX.publicKey, positionOwner.publicKey, payer);
                yield (0, associated_token_account_1.createAssociatedTokenAccountSend)(this.connection, tokenY.publicKey, positionOwner.publicKey, payer);
            })));
        });
    }
    setPairs(pairs) {
        return __awaiter(this, void 0, void 0, function* () {
            this.pairs = pairs;
        });
    }
    /**
     * The admin user is making these transactions
     *
     * For every pair in our token account, we need to
     * Get the oracle price for every pair
     * Get the ratio for each pair
     * Check how much was swapped already
     * Swap the rest / difference of this
     * Rename `mockMarket` with `market` everywhere
     *
     * @param initializer
     */
    swapReserveToAllAssetPairs(amount, backToCurrency = false) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this.pairs.map((pair) => __awaiter(this, void 0, void 0, function* () {
                // console.log("Looking at pair: ", pair.tokenX.toString(), pair.tokenY.toString());
                console.log("(tokenX) when swapping to Pairs: ", pair.tokenX.toString());
                console.log("(tokenY) when swapping to Pairs: ", pair.tokenY.toString());
                chai_1.assert.ok(pair.tokenX.equals(pair.currencyMint) || pair.tokenY.equals(pair.currencyMint));
                // Create token accounts for the
                const poolAddress = yield pair.getAddress(this.invariantProgram.programId);
                // Create a tokenX, and tokenY account for us, and
                const pool = yield this.get(pair);
                // // Create a token for our QP Reserve
                // // If a token exists already, save it in the dictionary
                const tokenX = new spl_token_1.Token(this.connection, pair.tokenX, spl_token_1.TOKEN_PROGRAM_ID, this.wallet);
                const tokenY = new spl_token_1.Token(this.connection, pair.tokenY, spl_token_1.TOKEN_PROGRAM_ID, this.wallet);
                // Must create asset accounts, not QPT!!!
                // We're not fuckily trading QPT tokens. These are only redeemed etc.!!
                // TODO: Create accounts if not existent!
                // const QPTokenXAccount = await getAssociatedTokenAddressOffCurve(tokenX.publicKey, this.qPoolAccount);
                // const QPTokenYAccount = await getAssociatedTokenAddressOffCurve(tokenY.publicKey, this.qPoolAccount);
                console.log("('''qPoolAccount) here: ", this.qPoolAccount.toString());
                // createAssociatedTokenAccountSendUnsigned(
                //     this.connection,
                //     this.QPTMint.publicKey,
                //     this.bondPoolAccount,
                //     this.wallet
                // )
                const QPTokenXAccount = yield (0, sdk_2.createAssociatedTokenAccountSendUnsigned)(this.connection, tokenX.publicKey, this.qPoolAccount, this.provider.wallet);
                console.log("('''qPoolCurrencyAccount) 1: ", QPTokenXAccount.toString());
                const QPTokenYAccount = yield (0, sdk_2.createAssociatedTokenAccountSendUnsigned)(this.connection, tokenY.publicKey, this.qPoolAccount, this.provider.wallet);
                console.log("('''qPoolCurrencyAccount) 2: ", QPTokenYAccount.toString());
                chai_1.assert.ok((yield tokenX.getAccountInfo(QPTokenXAccount)).mint.equals(tokenX.publicKey), ("1 " + (yield tokenX.getAccountInfo(QPTokenXAccount)).mint.toString() + ", " + tokenX.publicKey.toString()));
                chai_1.assert.ok((yield tokenY.getAccountInfo(QPTokenYAccount)).mint.equals(tokenY.publicKey), ("2 " + (yield tokenY.getAccountInfo(QPTokenYAccount)).mint.toString() + ", " + tokenY.publicKey.toString()));
                chai_1.assert.ok((yield tokenX.getAccountInfo(pool.tokenXReserve)).mint.equals(tokenX.publicKey), ("3 " + (yield tokenX.getAccountInfo(pool.tokenXReserve)).mint.toString() + ", " + tokenX.publicKey.toString()));
                chai_1.assert.ok((yield tokenY.getAccountInfo(pool.tokenYReserve)).mint.equals(tokenY.publicKey), ("4 " + (yield tokenY.getAccountInfo(pool.tokenYReserve)).mint.toString() + ", " + tokenY.publicKey.toString()));
                // One of them must be the currency account of qpools,
                // and one of them must have some credit
                chai_1.assert.ok(((yield tokenX.getAccountInfo(QPTokenXAccount)).amount > (0, sdk_1.tou64)(0)) ||
                    ((yield tokenY.getAccountInfo(QPTokenYAccount)).amount > (0, sdk_1.tou64)(0)), String("(currency and target (tokenX and tokenY) amounts are: ) " +
                    ((yield tokenX.getAccountInfo(QPTokenXAccount)).amount) + " " +
                    ((yield tokenY.getAccountInfo(QPTokenYAccount)).amount)));
                // Get the sqrt price
                // And subtract some tolerance from this
                console.log("Sqrt price is: ", pool.sqrtPrice.v.toString());
                console.log("Liquidity provided is: ", pool.liquidity.v.toString());
                console.log("Liquidity in X are", (yield tokenX.getAccountInfo(pool.tokenXReserve)).amount.toString());
                console.log("Liquidity in Y are", (yield tokenY.getAccountInfo(pool.tokenYReserve)).amount.toString());
                // Not entirely sure what this is!
                let xToY;
                if ((!backToCurrency) && tokenX.publicKey.equals(pair.currencyMint)) {
                    xToY = true;
                }
                else {
                    xToY = false;
                }
                console.log("xToY is: ", xToY);
                // const xToY = true;
                const slippage = (0, utils_1.toDecimal)(5, 1);
                // Calculate price limit after slippage
                const priceLimit = (0, math_1.calculatePriceAfterSlippage)(pool.sqrtPrice, slippage, !xToY).v;
                // 9_223_372_036_854_775_807
                // 1_000_000_000_000
                console.log("Slippage is: ", slippage.v.div(sdk_1.DENOMINATOR.div(new anchor_1.BN(1000))).toString());
                // pool.sqrtPrice.v.sub(new BN(500_000_000_000))
                let byAmountIn = false;
                // Now run the RPC Call
                console.log("Inputs are: ");
                console.log("Inputs are: ", this.bumpQPoolAccount, 
                // xToY: bool,
                byAmountIn, 
                // amount: u64,
                new anchor_1.BN(amount).toString(), 
                // by_amount_in: bool,
                true, 
                // sqrt_price_limit: u128,
                priceLimit.toString());
                console.log({
                    initializer: this.wallet.publicKey.toString(),
                    owner: this.qPoolAccount.toString(),
                    tickmap: pool.tickmap.toString(),
                    token_x_mint: pair.tokenX.toString(),
                    token_y_mint: pair.tokenY.toString(),
                    reserve_account_x: pool.tokenXReserve.toString(),
                    reserve_account_y: pool.tokenYReserve.toString(),
                    account_x: QPTokenXAccount.toString(),
                    account_y: QPTokenYAccount.toString(),
                    pool: poolAddress.toString(),
                    state: this.mockMarket.stateAddress.toString(),
                    program_authority: this.mockMarket.programAuthority.toString(),
                    token_program: spl_token_1.TOKEN_PROGRAM_ID.toString(),
                    invariant_program: this.invariantProgram.programId.toString(),
                    system_program: anchor_1.web3.SystemProgram.programId.toString(),
                });
                let beforeFromCurrency;
                let beforeToCurrency;
                let beforeFromAsset;
                let beforeToAsset;
                console.log("Swaps (Before)");
                if (xToY) {
                    console.log("Currency PK is: ", pair.tokenX.toString());
                    beforeFromCurrency = (yield tokenX.getAccountInfo(QPTokenXAccount)).amount;
                    console.log("Currency Account From ", beforeFromCurrency.toString());
                    beforeToCurrency = (yield tokenX.getAccountInfo(pool.tokenXReserve)).amount;
                    console.log("Currency Account To ", beforeToCurrency.toString());
                    beforeFromAsset = (yield tokenY.getAccountInfo(QPTokenYAccount)).amount;
                    console.log("Target Token From ", beforeFromAsset.toString());
                    beforeToAsset = (yield tokenY.getAccountInfo(pool.tokenYReserve)).amount;
                    console.log("Target Token To ", beforeToAsset.toString());
                }
                else {
                    console.log("Currency PK is: ", pair.tokenY.toString());
                    beforeFromCurrency = (yield tokenY.getAccountInfo(QPTokenYAccount)).amount;
                    console.log("Currency Account From ", beforeFromCurrency.toString());
                    beforeToCurrency = (yield tokenY.getAccountInfo(pool.tokenYReserve)).amount;
                    console.log("Currency Account To ", beforeToCurrency.toString());
                    beforeFromAsset = (yield tokenX.getAccountInfo(QPTokenXAccount)).amount;
                    console.log("Target Token From  ", beforeFromAsset.toString());
                    beforeToAsset = (yield tokenX.getAccountInfo(pool.tokenXReserve)).amount;
                    console.log("Target Token To  ", beforeToAsset.toString());
                }
                const tx = yield this.solbondProgram.rpc.swapPair(this.bumpQPoolAccount, 
                // xToY: boolea,
                xToY, 
                // amount: u64,
                new anchor_1.BN(amount), 
                // by_amount_in: bool,
                byAmountIn, 
                // sqrt_price_limit: u128,
                // 1_000_000_000_000
                priceLimit, {
                    accounts: {
                        initializer: this.wallet.publicKey,
                        owner: this.qPoolAccount,
                        pool: poolAddress,
                        state: this.mockMarket.stateAddress,
                        tickmap: pool.tickmap,
                        tokenXMint: pair.tokenX,
                        tokenYMint: pair.tokenY,
                        reserveAccountX: pool.tokenXReserve,
                        reserveAccountY: pool.tokenYReserve,
                        accountX: QPTokenXAccount,
                        accountY: QPTokenYAccount,
                        programAuthority: this.mockMarket.programAuthority,
                        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                        invariantProgram: this.invariantProgram.programId,
                        systemProgram: anchor_1.web3.SystemProgram.programId,
                    },
                    signers: [this.wallet]
                });
                yield this.connection.confirmTransaction(tx);
                console.log("Transaction id is: ", tx);
                yield delay(5000);
                let afterFromCurrency;
                let afterToCurrency;
                let afterFromAsset;
                let afterToAsset;
                console.log("Swaps (After)");
                if (xToY) {
                    afterFromCurrency = (yield tokenX.getAccountInfo(QPTokenXAccount)).amount;
                    console.log("Currency Account From ", afterFromCurrency.toString());
                    afterToCurrency = (yield tokenX.getAccountInfo(pool.tokenXReserve)).amount;
                    console.log("Currency Account To ", afterToCurrency.toString());
                    afterFromAsset = (yield tokenY.getAccountInfo(QPTokenYAccount)).amount;
                    console.log("Target Token From ", afterFromAsset.toString());
                    afterToAsset = (yield tokenY.getAccountInfo(pool.tokenYReserve)).amount;
                    console.log("Target Token To ", afterToAsset.toString());
                }
                else {
                    afterFromCurrency = (yield tokenY.getAccountInfo(QPTokenYAccount)).amount;
                    console.log("Currency Account From ", afterFromCurrency.toString());
                    afterToCurrency = (yield tokenY.getAccountInfo(pool.tokenYReserve)).amount;
                    console.log("Currency Account To ", afterToCurrency.toString());
                    afterFromAsset = (yield tokenX.getAccountInfo(QPTokenXAccount)).amount;
                    console.log("Target Token From  ", afterFromAsset.toString());
                    afterToAsset = (yield tokenX.getAccountInfo(pool.tokenXReserve)).amount;
                    console.log("Target Token To  ", afterToAsset.toString());
                }
                // TODO: This does not work properly!! Get back to this in a bit!!
                // This works when by_amount_in: false, but not by_amount_in: true!
            })));
        });
    }
    // TODO: Create Position
    // TODO: Close Position
    // TODO: Claim Fee
    // TODO: Redeem Bond
    // Later on we should probably remove initializer from the seeds completely, then anyone can call this
    // And the user could prob get some governance tokens out of it ... Actually not needed, because the generating program is the owner of this by default
    /**
     * Swap assets back from the liquidity-pool assets
     * back to the currency asset
     * @param amount
     */
    swapAllAssetPairsToReserve(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.swapReserveToAllAssetPairs(amount, true);
        });
    }
    getPositionListSeeds(owner) {
        return __awaiter(this, void 0, void 0, function* () {
            const POSITION_LIST_SEED = 'positionlistv1';
            const [positionListAddress, positionListBump] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from(anchor_1.utils.bytes.utf8.encode(POSITION_LIST_SEED)), owner.toBuffer()], this.solbondProgram.programId);
            return {
                positionListAddress,
                positionListBump
            };
        });
    }
    createPositionList() {
        return __awaiter(this, void 0, void 0, function* () {
            const { positionListAddress, positionListBump } = yield this.mockMarket.getPositionListAddress(this.qPoolAccount);
            const ix = this.invariantProgram.instruction.createPositionList(positionListBump, {
                accounts: {
                    positionList: positionListAddress,
                    owner: this.qPoolAccount,
                    signer: this.wallet.publicKey,
                    rent: web3_js_1.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3_js_1.SystemProgram.programId
                }
            });
            // const ix = await this.mockMarket.createPositionListInstruction(this.qPoolAccount);
            const tx = yield (0, sdk_1.signAndSend)(new web3_js_1.Transaction().add(ix), [this.wallet], this.connection);
            yield this.connection.confirmTransaction(tx);
        });
    }
    createPositions() {
        return __awaiter(this, void 0, void 0, function* () {
            // For each pair, create a position!
            yield Promise.all(this.pairs.map((pair) => __awaiter(this, void 0, void 0, function* () {
                console.log();
                // Ticks should be well-defined for now!
                const lowerTick = -50;
                const upperTick = 50;
                const poolAddress = yield pair.getAddress(this.invariantProgram.programId);
                const [tickmap, pool] = yield Promise.all([this.mockMarket.getTickmap(pair), this.mockMarket.get(pair)]);
                const lowerExists = (0, math_1.isInitialized)(tickmap, lowerTick, pool.tickSpacing);
                const upperExists = (0, math_1.isInitialized)(tickmap, upperTick, pool.tickSpacing);
                const tx = new web3_js_1.Transaction();
                // TODO: Who is the owner here
                // Let's assume its the reserve / qPoolAccount
                if (!lowerExists) {
                    tx.add(yield this.mockMarket.createTickInstruction(pair, lowerTick, this.qPoolAccount));
                }
                if (!upperExists) {
                    tx.add(yield this.mockMarket.createTickInstruction(pair, upperTick, this.qPoolAccount));
                }
                const { positionListAddress } = yield this.mockMarket.getPositionListAddress(this.qPoolAccount);
                const account = yield this.connection.getAccountInfo(positionListAddress);
                if (account === null) {
                    tx.add(yield this.mockMarket.createPositionListInstruction(this.qPoolAccount));
                }
                yield (0, sdk_1.signAndSend)(tx, [this.wallet], this.connection);
                // Retrieve tick addresses
                const { tickAddress: lowerTickPDA, tickBump: lowerTickPDABump } = yield this.mockMarket.getTickAddress(pair, lowerTick);
                const { tickAddress: upperTickPDA, tickBump: upperTickPDABump } = yield this.mockMarket.getTickAddress(pair, upperTick);
                // Get AccountX and AccountY
                const QPTokenXAccount = yield (0, sdk_2.createAssociatedTokenAccountSendUnsigned)(this.connection, pool.tokenX, this.qPoolAccount, this.provider.wallet);
                console.log("('''qPoolTokenXAccount) ", QPTokenXAccount.toString());
                const QPTokenYAccount = yield (0, sdk_2.createAssociatedTokenAccountSendUnsigned)(this.connection, pool.tokenY, this.qPoolAccount, this.provider.wallet);
                console.log("('''qPoolTokenYAccount) ", QPTokenYAccount.toString());
                // Get pool address
                // Do a PDA position generation
                const POSITION_SEED = 'positionv1';
                const index = 0; // TODO: Gotta find index first
                const indexBuffer = Buffer.alloc(4);
                indexBuffer.writeInt32LE(0);
                // Should not have wallet as seed,
                // but should have
                //
                const [positionAddress, positionBump] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from(anchor_1.utils.bytes.utf8.encode(POSITION_SEED)), this.qPoolAccount.toBuffer(), indexBuffer], 
                // this.invariantProgram.programId
                this.invariantProgram.programId);
                console.log("invariant program id is: ", this.invariantProgram.programId.toString());
                // console.log("Owning account: ", this.invariantProgram.programId.toString());
                // console.log("Owning account: ", this.solbondProgram.programId);
                // const {positionAddress, positionBump} = await this.mockMarket.getPositionAddress(
                //     this.qPoolAccount,
                //     (await this.mockMarket.getPositionList(this.qPoolAccount)).head
                // );
                // TODO: Figure out how to calculate the liquidity delta
                const liquidityDelta = new anchor_1.BN(1);
                // I guess liquidity delta is calculated globally
                console.log("Debug liquidity providing");
                console.log(positionBump, this.bumpQPoolAccount, lowerTick, upperTick, liquidityDelta, {
                    accounts: {
                        // Create liquidity accounts
                        initializer: this.wallet.publicKey.toString(),
                        state: this.mockMarket.stateAddress.toString(),
                        position: positionAddress.toString(),
                        pool: poolAddress.toString(),
                        positionList: positionListAddress.toString(),
                        owner: this.qPoolAccount.toString(),
                        lowerTick: lowerTickPDA.toString(),
                        upperTick: upperTickPDA.toString(),
                        tokenX: pool.tokenX.toString(),
                        tokenY: pool.tokenY.toString(),
                        accountX: QPTokenXAccount.toString(),
                        accountY: QPTokenYAccount.toString(),
                        reserveX: pool.tokenXReserve.toString(),
                        reserveY: pool.tokenYReserve.toString(),
                        // Auxiliary Accounts
                        programAuthority: this.mockMarket.programAuthority.toString(),
                        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID.toString(),
                        invariantProgram: this.invariantProgram.programId.toString(),
                        systemProgram: anchor_1.web3.SystemProgram.programId.toString(),
                        rent: anchor.web3.SYSVAR_RENT_PUBKEY.toString()
                    }
                });
                yield this.solbondProgram.rpc.createLiquidityPosition(positionBump, this.bumpQPoolAccount, new anchor_1.BN(lowerTick), new anchor_1.BN(upperTick), new anchor_1.BN(liquidityDelta), {
                    accounts: {
                        // Create liquidity accounts
                        initializer: this.wallet.publicKey,
                        state: this.mockMarket.stateAddress,
                        position: positionAddress,
                        pool: poolAddress,
                        positionList: positionListAddress,
                        owner: this.qPoolAccount,
                        lowerTick: lowerTickPDA,
                        upperTick: upperTickPDA,
                        tokenX: pool.tokenX,
                        tokenY: pool.tokenY,
                        accountX: QPTokenXAccount,
                        accountY: QPTokenYAccount,
                        reserveX: pool.tokenXReserve,
                        reserveY: pool.tokenYReserve,
                        // Auxiliary Accounts
                        programAuthority: this.mockMarket.programAuthority,
                        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                        systemProgram: anchor_1.web3.SystemProgram.programId,
                        invariantProgram: this.invariantProgram.programId,
                    },
                    signers: [this.wallet]
                });
            })));
        });
    }
}
exports.QPoolsAdmin = QPoolsAdmin;
