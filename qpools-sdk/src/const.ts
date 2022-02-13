import {PublicKey} from "@solana/web3.js";
import {BN} from "@project-serum/anchor";

export const REDEEMABLES_DECIMALS = 9;

export const MOCK = {
    // DEV: {
    //     SOL: new PublicKey("F8G26LpQSBUvdoYtAXJccLKUqQqzTdHwaoHixTDhcLJ1"),
    //     USDC: new PublicKey("7xkFjfVqjhM9sVPY7WNKB8NmTyGVLD5UN8X2ZkwAn1fp"),
    //     mSOL: new PublicKey("BNXT31pJZp8CBafSxet6cM37yPGz8ZWo3iYsGG7hbaKt"),
    // },
    DEV: {
        SOL: new PublicKey('BJVjNqQzM1fywLWzzKbQEZ2Jsx9AVyhSLWzko3yF68PH'),
        USDC: new PublicKey('5ihkgQGjKvWvmMtywTgLdwokZ6hqFv5AgxSyYoCNufQW'),
        USDT: new PublicKey('4cZv7KgYNgmr3NZSDhT5bhXGGttXKTndqyXeeC1cB6Xm'),
        MSOL: new PublicKey('4r8WDEvBntEr3dT69p7ua1rsaWcpTSHnKpY5JugDkcPQ'),

        SABER_USDC: new PublicKey('2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8'),
        SABER_USDC_DECIMALS: 6,
        SABER_TESTUSD: new PublicKey('4QgnWUPQmfGB5dTDCcc4ZFeZDK7xNVhCUFoNmmYFwAme'),
        SABER_PAI: new PublicKey('4ry1pMstKzMJvMZSms62HduTyCbbqkUyrz17x1dajBmL'),
        SABER_sWBTC: new PublicKey('BtceyXMo5kwg8u6es4NoukBWQuMwtcBCZpFWUfZgVuZs'),
        SABER_CASH: new PublicKey('CASHVDm2wsJXfhj6VWxb7GiMdoLc17Du7paH4bNr5woT'),
        SABER_USDT: new PublicKey('EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS'),
        SABER_RENBTC: new PublicKey('Ren3RLPCG6hpKay86d2fQccQLuGG331UNxwn2VTw3GJ'),
        SABER_SABER: new PublicKey('Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1'),
        SABER_WBTC: new PublicKey('Wbt2CgkkD3eVckD5XxWJmT8pTnFTyWrwvGM7bUMLvsM'),
        SABER_POOL: {
            USDC_USDT: new PublicKey("VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL"),
            USDC_CASH: new PublicKey("B94iYzzWe7Q3ksvRnt5yJm6G5YquerRFKpsUVUvasdmA"),
            USDC_PAI: new PublicKey("DoycojcYVwc42yCpGb4CvkbuKJkQ6KBTugLdJXv3U8ZE"),
            USDT_CASH: new PublicKey("TEJVTFTsqFEuoNNGu864ED4MJuZr8weByrsYYpZGCfQ"),
            USDC_TEST: new PublicKey("AqBGfWy3D9NpW8LuknrSSuv93tJUBiPWYxkBrettkG7x"),
        },
        stableSwapProgramId: new PublicKey("SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ"),
        // USDC_USDT_pubkey = new PublicKey("VeNkoB1HvSP6bSeGybQDnx9wTWFsQb2NBCemeCDSuKL");
        // USDC_CASH_pubkey = new PublicKey("B94iYzzWe7Q3ksvRnt5yJm6G5YquerRFKpsUVUvasdmA");
        // USDC_TEST_pubkey = new PublicKey("AqBGfWy3D9NpW8LuknrSSuv93tJUBiPWYxkBrettkG7x");
    },
    MAIN: {
        SOL: new PublicKey('So11111111111111111111111111111111111111112'),
        USDC: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        USDT: new PublicKey('F5GuftC65xBqV3rbKN7xgJfZM8Xgma99E58gtgrrrDpR'),
        MSOL: new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So')
    }
}

export const PYTH_PRODUCTS = {
    "SOL/USD" : {
        product: "ALP8SdU9oARYVLgLR7LrqMNCYBnhtnQz1cj6bwgwQmgj",
        price: "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG"
    },
    "mSOL/USD" : {
        product: "BS2iAqT67j8hA9Jji4B8UpL3Nfw9kwPfU5s4qeaf1e7r",
        price: "E4v1BBgoso9s64TQvmyownAVJbhbEPGyzA3qn4n46qj9"
    },
}

export const MATH_DENOMINATOR = new BN(1e12);