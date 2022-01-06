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
exports.tou64 = exports.createAssociatedTokenAccountUnsigned = exports.getAssociatedTokenAddressOffCurve = exports.createAssociatedTokenAccountSendUnsigned = exports.getBlockchainEpoch = exports.waitForEpoch = exports.createTokenAccount = exports.getPayer = exports.createMint = exports.createMint2 = exports.delay = void 0;
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const easy_spl_1 = require("easy-spl");
const spl = require("@solana/spl-token");
const DEFAULT_DECIMALS = 6;
let _payer = null;
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.delay = delay;
function createMint2(provider) {
    return __awaiter(this, void 0, void 0, function* () {
        let authority = provider.wallet.publicKey;
        const mint = yield spl.Token.createMint(provider.connection, provider.wallet.payer, authority, null, 9, spl_token_1.TOKEN_PROGRAM_ID);
        return mint;
    });
}
exports.createMint2 = createMint2;
function createMint(provider, payer, authority, decimals = DEFAULT_DECIMALS) {
    return __awaiter(this, void 0, void 0, function* () {
        if (authority === undefined) {
            authority = provider.wallet.publicKey;
        }
        const token = yield spl_token_1.Token.createMint(provider.connection, payer, authority, authority, decimals, spl_token_1.TOKEN_PROGRAM_ID);
        return token;
    });
}
exports.createMint = createMint;
function getPayer() {
    if (_payer != null) {
        return _payer;
    }
    const process = require("process");
    _payer = web3_js_1.Keypair.fromSecretKey(Buffer.from(JSON.parse(require("fs").readFileSync(process.env.ANCHOR_WALLET, {
        encoding: "utf-8",
    }))));
    return _payer;
}
exports.getPayer = getPayer;
function createTokenAccount(provider, mint, owner) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = new spl.Token(provider.connection, mint, spl_token_1.TOKEN_PROGRAM_ID, provider.wallet.payer);
        let vault = yield token.createAssociatedTokenAccount(owner);
        return vault;
    });
}
exports.createTokenAccount = createTokenAccount;
function waitForEpoch(epoch, provider) {
    return __awaiter(this, void 0, void 0, function* () {
        let now = yield getBlockchainEpoch(provider);
        while (now <= epoch.toNumber()) {
            yield sleep(1000);
            now = yield getBlockchainEpoch(provider);
        }
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            resolve();
        }));
    });
}
exports.waitForEpoch = waitForEpoch;
function getBlockchainEpoch(provider) {
    return __awaiter(this, void 0, void 0, function* () {
        const currentSlot = (yield provider.connection.getEpochInfo()).absoluteSlot;
        const time = yield provider.connection.getBlockTime(currentSlot);
        return time;
    });
}
exports.getBlockchainEpoch = getBlockchainEpoch;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/*
    Associated Token Accounts
*/
/**
 * Associated Token Account
 * @param conn
 * @param mint
 * @param owner
 * @param wallet
 */
const createAssociatedTokenAccountSendUnsigned = (conn, mint, owner, wallet) => __awaiter(void 0, void 0, void 0, function* () {
    const address = yield (0, exports.getAssociatedTokenAddressOffCurve)(mint, owner);
    if (yield easy_spl_1.account.exists(conn, address)) {
        return address;
    }
    const tx = yield (0, exports.createAssociatedTokenAccountUnsigned)(conn, mint, address, owner, wallet);
    yield easy_spl_1.util.sendAndConfirm(conn, tx);
    return address;
});
exports.createAssociatedTokenAccountSendUnsigned = createAssociatedTokenAccountSendUnsigned;
const getAssociatedTokenAddressOffCurve = (mint, user) => __awaiter(void 0, void 0, void 0, function* () {
    return spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, mint, user, true);
});
exports.getAssociatedTokenAddressOffCurve = getAssociatedTokenAddressOffCurve;
const createAssociatedTokenAccountUnsigned = (conn, mint, address, owner, wallet) => __awaiter(void 0, void 0, void 0, function* () {
    if (!address) {
        address = yield spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, mint, owner, true);
    }
    let instructions = [
        spl_token_1.Token.createAssociatedTokenAccountInstruction(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, mint, address, owner, wallet.publicKey)
    ];
    let tx = yield easy_spl_1.util.wrapInstructions(conn, instructions, wallet.publicKey);
    // const tx = await createAssociatedTokenAccountTx(conn, mint, owner, wallet.publicKey);
    return yield wallet.signTransaction(tx);
});
exports.createAssociatedTokenAccountUnsigned = createAssociatedTokenAccountUnsigned;
const tou64 = (amount) => {
    // @ts-ignore
    // eslint-disable-next-line new-cap
    return new spl_token_1.u64(amount.toString());
};
exports.tou64 = tou64;
