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
const sdk_1 = require("@qpools/sdk");
const coinGeckoClient_1 = require("@qpools/sdk/lib/oracle/coinGeckoClient");
describe('Price oracle test', () => {
    const provider = anchor_1.Provider.local(process.env.NEXT_PUBLIC_CLUSTER_URL);
    //anchor.setProvider(provider);
    const connection = provider.connection;
    let registry = new sdk_1.Registry(connection);
    let coinGeckoClient = new coinGeckoClient_1.CoinGeckoClient(registry);
    /*it("Get prices for our registered tokens from coingecko", async () => {
        let data = await coinGeckoClient.getDataForAllRegisteredTokens();
        console.log("data is : ", data);
    });*/
    it("Currency : MSOL - Multiply amount by usd price", () => __awaiter(void 0, void 0, void 0, function* () {
        let value = yield coinGeckoClient.multiplyAmountByUSDPrice(100, new web3_js_1.PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"));
        console.log("Total value of msol is : ", value.toString());
    }));
    it("Currency : sol - Multiply amount by usd price", () => __awaiter(void 0, void 0, void 0, function* () {
        let value = yield coinGeckoClient.multiplyAmountByUSDPrice(100, new web3_js_1.PublicKey("NativeSo11111111111111111111111111111111111"));
        console.log("Total value of sol is : ", value.toString());
    }));
    it("Currency : wSOL - Multiply amount by usd price", () => __awaiter(void 0, void 0, void 0, function* () {
        let value = yield coinGeckoClient.multiplyAmountByUSDPrice(100, new web3_js_1.PublicKey("So11111111111111111111111111111111111111112"));
        console.log("Total value of wsol is : ", value.toString());
    }));
    it("Currency : USDC - Multiply amount by usd price", () => __awaiter(void 0, void 0, void 0, function* () {
        let value = yield coinGeckoClient.multiplyAmountByUSDPrice(100, sdk_1.MOCK.DEV.SABER_USDC);
        console.log("Total value of usdc is : ", value.toString());
    }));
    it("Currency : Bullshit pubkey - Multiply amount by usd price", () => __awaiter(void 0, void 0, void 0, function* () {
        let value = yield coinGeckoClient.multiplyAmountByUSDPrice(100, new web3_js_1.PublicKey(new web3_js_1.PublicKey("So11111111331111122111111111111111111111112")));
        console.log("Total value of usdc is : ", value.toString());
    }));
});
