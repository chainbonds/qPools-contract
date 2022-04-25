import {BN, Provider} from '@project-serum/anchor';
import {PublicKey} from "@solana/web3.js";
import {MOCK, Registry} from "@qpools/sdk";
import {CoinGeckoClient} from "@qpools/sdk/lib/oracle/coinGeckoClient";

describe('Price oracle test', () => {

    const provider = Provider.local("https://withered-twilight-frost.solana-devnet.quiknode.pro/43ea73628381d3d62b1edd54c1d3b5eb18737fef/");
    //anchor.setProvider(provider);
    const connection = provider.connection;
    let registry = new Registry(connection);
    let coinGeckoClient = new CoinGeckoClient(registry);

    /*it("Get prices for our registered tokens from coingecko", async () => {
        let data = await coinGeckoClient.getDataForAllRegisteredTokens();
        console.log("data is : ", data);
    });*/

    it("Currency : MSOL - Multiply amount by usd price", async () => {
        let value = await coinGeckoClient.multiplyAmountByUSDPrice(100, new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"));
        console.log("Total value of msol is : ", value.toString());
    });

    it("Currency : sol - Multiply amount by usd price", async () => {
        let value = await coinGeckoClient.multiplyAmountByUSDPrice(100, new PublicKey("NativeSo11111111111111111111111111111111111"));
        console.log("Total value of sol is : ", value.toString());
    });

    it("Currency : wSOL - Multiply amount by usd price", async () => {
        let value = await coinGeckoClient.multiplyAmountByUSDPrice(100, new PublicKey("So11111111111111111111111111111111111111112"));
        console.log("Total value of wsol is : ", value.toString());
    });
    it("Currency : USDC - Multiply amount by usd price", async () => {
        let value = await coinGeckoClient.multiplyAmountByUSDPrice(100, MOCK.DEV.SABER_USDC);
        console.log("Total value of usdc is : ", value.toString());

    });
    it("Currency : Bullshit pubkey - Multiply amount by usd price", async () => {
        let value = await coinGeckoClient.multiplyAmountByUSDPrice(100, new PublicKey(new PublicKey("So11111111331111122111111111111111111111112")));
        console.log("Total value of usdc is : ", value.toString());

    });


})
