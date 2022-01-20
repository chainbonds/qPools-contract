import {PublicKey} from "@solana/web3.js";

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
        MSOL: new PublicKey('4r8WDEvBntEr3dT69p7ua1rsaWcpTSHnKpY5JugDkcPQ')
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