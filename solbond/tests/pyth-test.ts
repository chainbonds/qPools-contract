import {BN, Provider} from '@project-serum/anchor';
import {multiplyAmountByPythprice} from "@qpools/sdk";
import {PublicKey} from "@solana/web3.js";
import {MOCK} from "@qpools/sdk";
import {PythProvider} from "@qpools/sdk/lib/oracle/pyth-provider";

describe('qPools!', () => {


    it("Get Solana price from Symbol", async () => {
        let pythprovider = new PythProvider();
        let price = await pythprovider.getPrice("SOL");
        console.log("PRICE OF SOL IS " , price);
    });

    it("Get mSOL Price from mint", async () => {
        let pK = new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");
        let totalValue = await multiplyAmountByPythprice(100,pK);
        console.log(totalValue);
    });
    it("Get wSOL Price from mint", async () => {
        let pK = new PublicKey("So11111111111111111111111111111111111111112");
        let totalValue = await multiplyAmountByPythprice(100,pK);
        console.log(totalValue);
    });
    it("Get native SOL Price from mint", async () => {
        let pK = new PublicKey("NativeSo11111111111111111111111111111111111");
        let totalValue = await multiplyAmountByPythprice(100,pK);
        console.log(totalValue);
    });
    //We have not defined USDC token in the registry, thus cant find the symbol name and price returns 0.
    //It should be fine since we use saber-usdc
    it("Get USDC Price from mint", async () => {
        let pK = MOCK.DEV.USDC;
        let totalValue = await multiplyAmountByPythprice(100,pK);
        console.log(totalValue);
    });

    //Tests below use the method in the class
    it("Get Saber-USDC Price from mint", async () => {
        let pK = MOCK.DEV.SABER_USDC;
        let pythProvider = new PythProvider();
        let totalValue = await pythProvider.multiplyAmountByPythprice(100,pK);
        console.log("usdc total value :", totalValue);
    });

    //first query takes 1 sec, followings followings apprx 10ms.
    it("10 additional queries to see how fast it is", async () => {
        let pK = MOCK.DEV.SABER_USDC;
        let pythProvider = new PythProvider();
        let totalValue = await pythProvider.multiplyAmountByPythprice(100,pK);
        await pythProvider.multiplyAmountByPythprice(100,pK);
        await pythProvider.multiplyAmountByPythprice(100,pK);
        await pythProvider.multiplyAmountByPythprice(100,pK);
        await pythProvider.multiplyAmountByPythprice(100,pK);
        await pythProvider.multiplyAmountByPythprice(100,pK);
        await pythProvider.multiplyAmountByPythprice(100,pK);
        await pythProvider.multiplyAmountByPythprice(100,pK);
        await pythProvider.multiplyAmountByPythprice(100,pK);
        await pythProvider.multiplyAmountByPythprice(100,pK);
        await pythProvider.multiplyAmountByPythprice(100,pK);
        console.log("usdc total value :", totalValue);
    });

})
