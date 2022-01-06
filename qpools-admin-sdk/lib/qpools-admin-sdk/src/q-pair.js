"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QPair = void 0;
const sdk_1 = require("@invariant-labs/sdk");
class QPair extends sdk_1.Pair {
    setCurrencyMint(_currencyMint) {
        this.currencyMint = _currencyMint;
    }
}
exports.QPair = QPair;
