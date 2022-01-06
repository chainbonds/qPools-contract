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
exports.QPoolsUser = void 0;
/**
 * This is the file that can later on be shared with the frontend
 * The other qpools files will be used as an admin, and should probably not be open
 */
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@project-serum/anchor");
const anchor = __importStar(require("@project-serum/anchor"));
const spl_token_1 = require("@solana/spl-token");
const solbond_program_1 = require("./solbond-program");
const utils_1 = require("./utils");
// export interface Tickmap {
//     bitmap: Array<number>
// }
class QPoolsUser {
    constructor(provider, 
    // wallet: IWallet,
    connection, currencyMint) {
        this.connection = connection;
        this.wallet = provider.wallet;
        this.provider = provider;
        this.solbondProgram = (0, solbond_program_1.getSolbondProgram)(this.connection, this.provider);
        //@ts-expect-error
        this.walletPayer = this.wallet.payer;
        // Add the bond pool account here too
        this.currencyMint = currencyMint;
        web3_js_1.PublicKey.findProgramAddress([this.currencyMint.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("bondPoolAccount1"))], this.solbondProgram.programId).then(([_qPoolAccount, _bumpQPoolAccount]) => {
            this.qPoolAccount = _qPoolAccount;
            this.bumpQPoolAccount = _bumpQPoolAccount;
        });
        this.loadExistingQPTReserve(this.currencyMint.publicKey).then(() => {
            console.log("Successfully loaded QPT Reserv!");
        }).catch((error) => {
            console.log("error loading existing QPT reserve!");
            console.log(JSON.stringify(error));
        });
        // this.qPoolAccount = null;
        // this.bumpQPoolAccount = null;
        // this.qPoolQPAccount = null;
        // this.purchaserCurrencyAccount = null;
        // this.purchaserQPTAccount = null;
        // this.qPoolCurrencyAccount = null;
    }
    loadExistingQPTReserve(currencyMintPubkey) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Fetching QPT reserve...");
            if (!currencyMintPubkey) {
                throw Error("currencyMintPubkey: " + currencyMintPubkey.toString());
            }
            [this.qPoolAccount, this.bumpQPoolAccount] = yield web3_js_1.PublicKey.findProgramAddress([currencyMintPubkey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("bondPoolAccount1"))], this.solbondProgram.programId);
            // Get the token account
            console.log("qPoolAccount", this.qPoolAccount.toString());
            // @ts-ignore
            let bondPoolAccount = (yield this.solbondProgram.account.bondPoolAccount.fetch(this.qPoolAccount));
            if (!bondPoolAccount.bondPoolCurrencyTokenMint.equals(currencyMintPubkey)) {
                console.log(bondPoolAccount.bondPoolCurrencyTokenMint.toString());
                console.log(currencyMintPubkey.toString());
                throw Error("mint is not the same!: " + currencyMintPubkey.toString());
            }
            // Check if this is empty.
            // If empty, return false
            this.currencyMint = new spl_token_1.Token(this.connection, bondPoolAccount.bondPoolCurrencyTokenMint, this.solbondProgram.programId, this.walletPayer);
            this.QPTokenMint = new spl_token_1.Token(this.connection, bondPoolAccount.bondPoolRedeemableMint, this.solbondProgram.programId, this.walletPayer);
            this.qPoolQPAccount = bondPoolAccount.bondPoolRedeemableTokenAccount;
            this.qPoolCurrencyAccount = bondPoolAccount.bondPoolCurrencyTokenAccount;
            console.log("Pretty printing loaded accounts...");
            this.prettyPrintAccounts();
        });
    }
    registerAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Registering account..");
            // Purchaser
            if (!this.qPoolQPAccount) {
                console.log("Creating a qPoolQPAccount");
                this.qPoolQPAccount = yield (0, utils_1.createAssociatedTokenAccountSendUnsigned)(this.connection, this.QPTokenMint.publicKey, this.qPoolAccount, this.provider.wallet);
                console.log("Done!");
            }
            if (!this.qPoolCurrencyAccount) {
                console.log("Creating a qPoolCurrencyAccount");
                this.qPoolCurrencyAccount = yield (0, utils_1.createAssociatedTokenAccountSendUnsigned)(this.connection, this.currencyMint.publicKey, this.qPoolAccount, this.provider.wallet);
                console.log("Done!");
            }
            // Create the reserve account, if none exists
            // console.log("Going to create the this.purchaserCurrencyAccount");
            if (!this.purchaserCurrencyAccount) {
                console.log("Creating a purchaserCurrencyAccount");
                this.purchaserCurrencyAccount = yield (0, utils_1.createAssociatedTokenAccountSendUnsigned)(this.connection, this.currencyMint.publicKey, this.wallet.publicKey, this.wallet);
                console.log("Done!");
            }
            // Same for the currency mint account, if none exists
            // console.log("Going to create the this.purchaserQPTAccount");
            if (!this.purchaserQPTAccount) {
                console.log("Creating a purchaserQPTAccount");
                this.purchaserQPTAccount = yield (0, utils_1.createAssociatedTokenAccountSendUnsigned)(this.connection, this.QPTokenMint.publicKey, this.wallet.publicKey, this.wallet);
                console.log("Done!");
            }
        });
    }
    prettyPrintAccounts() {
        console.log("solbondProgram", this.solbondProgram.programId.toString());
        console.log("wallet", this.wallet.publicKey.toString());
        console.log("🟢 qPoolAccount", this.qPoolAccount.toString());
        console.log("🟢 bumpQPoolAccount", this.bumpQPoolAccount.toString());
        console.log("🌊 QPTokenMint", this.QPTokenMint.publicKey.toString());
        console.log("🌊 qPoolQPAccount", this.qPoolQPAccount.toString());
        console.log("💵 currencyMint", this.currencyMint.publicKey.toString());
        console.log("💵 qPoolCurrencyAccount", this.qPoolCurrencyAccount.toString());
    }
    buyQPT(currency_amount_raw, verbose = false) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("BEGIN: buyQPT");
            if (!(currency_amount_raw > 0)) {
                // TODO: Also implement this in the contract
                console.log("Cannot buy negative token amounts!");
                return false;
            }
            console.log("Sending RPC call");
            console.log("Transfers (Before)");
            console.log("(Currency Mint) when buying QPT: ", this.currencyMint);
            console.log("(Currency Mint PK) when buying QPT: ", this.currencyMint.publicKey.toString());
            console.log("QPT Mint is: ", this.QPTokenMint);
            console.log("QPT (PK) Mint is: ", this.QPTokenMint.publicKey.toString());
            console.log("QP QPToken account: ", this.qPoolQPAccount.toString());
            if (verbose) {
                console.log("Sending ...");
                console.log({
                    currency_amount_raw: new anchor_1.BN(currency_amount_raw),
                    body: {
                        accounts: {
                            bondPoolAccount: this.qPoolAccount,
                            bondPoolRedeemableMint: this.QPTokenMint.publicKey,
                            bondPoolCurrencyTokenMint: this.currencyMint.publicKey,
                            bondPoolCurrencyTokenAccount: this.qPoolCurrencyAccount,
                            bondPoolRedeemableTokenAccount: this.qPoolQPAccount,
                            purchaser: this.wallet.publicKey,
                            purchaserCurrencyTokenAccount: this.purchaserCurrencyAccount,
                            purchaserRedeemableTokenAccount: this.purchaserQPTAccount,
                            // The standard accounts on top
                            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                            clock: anchor_1.web3.SYSVAR_CLOCK_PUBKEY,
                            systemProgram: anchor_1.web3.SystemProgram.programId,
                            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID
                        },
                        signers: [this.walletPayer]
                    }
                });
            }
            // let beforeQptFromAmount = (await this.QPTokenMint.getAccountInfo(this.qPoolQPAccount)).amount;
            // console.log("beforeQptFromAmount: ", beforeQptFromAmount.toString());
            // let beforeQptTargetAmount = (await this.QPTokenMint.getAccountInfo(this.purchaserQPTAccount)).amount;
            // console.log("beforeQptTargetAmount: ", beforeQptTargetAmount.toString());
            // let beforeCurrencyFromAmount = (await this.currencyMint.getAccountInfo(this.purchaserCurrencyAccount)).amount;
            // console.log("beforeCurrencyFromAmount: ", beforeCurrencyFromAmount.toString());
            // let beforeCurrencyTargetAmount = (await this.currencyMint.getAccountInfo(this.qPoolCurrencyAccount)).amount;
            // console.log("beforeCurrencyTargetAmount: ", beforeCurrencyTargetAmount.toString());
            console.log("Done getting account informations");
            const tx = yield this.solbondProgram.rpc.purchaseBond(new anchor_1.BN(currency_amount_raw), {
                accounts: {
                    bondPoolAccount: this.qPoolAccount,
                    bondPoolRedeemableMint: this.QPTokenMint.publicKey,
                    bondPoolCurrencyTokenMint: this.currencyMint.publicKey,
                    bondPoolCurrencyTokenAccount: this.qPoolCurrencyAccount,
                    bondPoolRedeemableTokenAccount: this.qPoolQPAccount,
                    purchaser: this.wallet.publicKey,
                    purchaserCurrencyTokenAccount: this.purchaserCurrencyAccount,
                    purchaserRedeemableTokenAccount: this.purchaserQPTAccount,
                    // The standard accounts on top
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: anchor_1.web3.SYSVAR_CLOCK_PUBKEY,
                    systemProgram: anchor_1.web3.SystemProgram.programId,
                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID
                },
                signers: [this.walletPayer]
            });
            yield this.connection.confirmTransaction(tx);
            // let afterQptFromAmount = (await this.QPTokenMint.getAccountInfo(this.qPoolQPAccount)).amount;
            // let afterQptTargetAmount = (await this.QPTokenMint.getAccountInfo(this.purchaserQPTAccount)).amount;
            // let afterCurrencyFromAmount = (await this.currencyMint.getAccountInfo(this.purchaserCurrencyAccount)).amount;
            // let afterCurrencyTargetAmount = (await this.currencyMint.getAccountInfo(this.qPoolCurrencyAccount)).amount;
            // console.log("afterQptFromAmount", afterQptFromAmount.toString());
            // console.log("afterQptTargetAmount", afterQptTargetAmount.toString());
            // console.log("afterCurrencyFromAmount", afterCurrencyFromAmount.toString());
            // console.log("afterCurrencyTargetAmount", afterCurrencyTargetAmount.toString());
            // assert.ok(beforeCurrencyFromAmount.eq(afterQptTargetAmount), String("(T1) " + beforeQptFromAmount.toString() + " " + afterQptTargetAmount.toString()));
            // assert.ok(beforeQptTargetAmount.eq(afterQptFromAmount), String("(T2) " + beforeQptTargetAmount.toString() + " " + afterQptFromAmount.toString()));
            // assert.ok(beforeCurrencyFromAmount.eq(afterCurrencyTargetAmount), String("(T3) " + beforeCurrencyFromAmount.toString() + " " + afterCurrencyTargetAmount.toString()));
            // assert.ok(beforeCurrencyTargetAmount.eq(afterCurrencyFromAmount), String("(T4) " + beforeCurrencyTargetAmount.toString() + " " + afterCurrencyFromAmount.toString()));
            // Make sure in the end that the token currency account has funds now
            // assert.ok(afterCurrencyTargetAmount > tou64(0), String("(T5)" + afterCurrencyTargetAmount.toString()));
            // console.log("Bond pool currency account is: ", this.qPoolCurrencyAccount.toString());
            console.log("END: buyQPT");
            return true;
        });
    }
    redeemQPT(qpt_amount_raw, verbose = false) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Redeeming ", qpt_amount_raw);
            if (!(qpt_amount_raw > 0)) {
                // TODO: Also implement this in the contract
                console.log("Cannot buy negative token amounts!");
                return false;
            }
            if (verbose) {
                console.log("Sending ...");
                console.log({
                    qpt_amount_raw: new anchor_1.BN(qpt_amount_raw),
                    body: {
                        accounts: {
                            bondPoolAccount: this.qPoolAccount,
                            bondPoolRedeemableMint: this.QPTokenMint.publicKey,
                            bondPoolCurrencyTokenMint: this.currencyMint.publicKey,
                            bondPoolCurrencyTokenAccount: this.qPoolCurrencyAccount,
                            bondPoolRedeemableTokenAccount: this.qPoolQPAccount,
                            purchaser: this.wallet.publicKey,
                            purchaserCurrencyTokenAccount: this.purchaserCurrencyAccount,
                            purchaserRedeemableTokenAccount: this.purchaserQPTAccount,
                            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                            clock: anchor_1.web3.SYSVAR_CLOCK_PUBKEY,
                            systemProgram: anchor_1.web3.SystemProgram.programId,
                            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID
                        },
                        signers: [this.walletPayer]
                    }
                });
            }
            // console.log("Sending RPC call");
            // console.log("Transfers (Before)");
            // console.log("(Currency Mint PK) when buying QPT: ", this.currencyMint.publicKey);
            // let beforeQptFromAmount = (await this.QPTokenMint.getAccountInfo(this.qPoolQPAccount)).amount;
            // let beforeQptTargetAmount = (await this.QPTokenMint.getAccountInfo(this.purchaserQPTAccount)).amount;
            // let beforeCurrencyFromAmount = (await this.currencyMint.getAccountInfo(this.purchaserCurrencyAccount)).amount;
            // let beforeCurrencyTargetAmount = (await this.currencyMint.getAccountInfo(this.qPoolCurrencyAccount)).amount;
            // console.log("beforeQptFromAmount", beforeQptFromAmount.toString());
            // console.log("beforeQptTargetAmount", beforeQptTargetAmount.toString());
            // console.log("beforeCurrencyFromAmount", beforeCurrencyFromAmount.toString());
            // console.log("beforeCurrencyTargetAmount", beforeCurrencyTargetAmount.toString());
            // console.log("Currency mint is: ", this.currencyMint.publicKey.toString());
            const initializeTx = yield this.solbondProgram.rpc.redeemBond(
            // Need to assign less than there is ...
            new anchor_1.BN(qpt_amount_raw), {
                accounts: {
                    bondPoolAccount: this.qPoolAccount,
                    bondPoolRedeemableMint: this.QPTokenMint.publicKey,
                    bondPoolCurrencyTokenMint: this.currencyMint.publicKey,
                    bondPoolCurrencyTokenAccount: this.qPoolCurrencyAccount,
                    bondPoolRedeemableTokenAccount: this.qPoolQPAccount,
                    purchaser: this.wallet.publicKey,
                    purchaserCurrencyTokenAccount: this.purchaserCurrencyAccount,
                    purchaserRedeemableTokenAccount: this.purchaserQPTAccount,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: anchor_1.web3.SYSVAR_CLOCK_PUBKEY,
                    systemProgram: anchor_1.web3.SystemProgram.programId,
                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID
                },
                signers: [this.walletPayer]
            });
            yield this.connection.confirmTransaction(initializeTx);
            // let afterQptFromAmount = (await this.QPTokenMint.getAccountInfo(this.qPoolQPAccount)).amount;
            // let afterQptTargetAmount = (await this.QPTokenMint.getAccountInfo(this.purchaserQPTAccount)).amount;
            // let afterCurrencyFromAmount = (await this.currencyMint.getAccountInfo(this.purchaserCurrencyAccount)).amount;
            // let afterCurrencyTargetAmount = (await this.currencyMint.getAccountInfo(this.qPoolCurrencyAccount)).amount;
            // console.log("afterQptFromAmount", afterQptFromAmount.toString());
            // console.log("afterQptTargetAmount", afterQptTargetAmount.toString());
            // console.log("afterCurrencyFromAmount", afterCurrencyFromAmount.toString());
            // console.log("afterCurrencyTargetAmount", afterCurrencyTargetAmount.toString());
            // TODO: Gotta modify all these value to account for redeem
            // assert.ok(beforeCurrencyFromAmount.eq(afterQptTargetAmount), String("(T1) " + beforeQptFromAmount.toString() + " " + afterQptTargetAmount.toString()));
            // assert.ok(beforeQptTargetAmount.eq(afterQptFromAmount), String("(T2) " + beforeQptTargetAmount.toString() + " " + afterQptFromAmount.toString()));
            // assert.ok(beforeCurrencyFromAmount.eq(afterCurrencyTargetAmount), String("(T3) " + beforeCurrencyFromAmount.toString() + " " + afterCurrencyTargetAmount.toString()));
            // assert.ok(beforeCurrencyTargetAmount.eq(afterCurrencyFromAmount), String("(T4) " + beforeCurrencyTargetAmount.toString() + " " + afterCurrencyFromAmount.toString()));
            // Make sure in the end that the token currency account has funds now
            // assert.ok(afterCurrencyTargetAmount > tou64(0), String("(T5)" + afterCurrencyTargetAmount.toString()));
            // console.log("Bond pool currency account is: ", this.qPoolCurrencyAccount.toString());
            return true;
        });
    }
}
exports.QPoolsUser = QPoolsUser;
