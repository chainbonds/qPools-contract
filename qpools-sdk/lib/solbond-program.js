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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSolbondProgram = void 0;
const anchor = __importStar(require("@project-serum/anchor"));
const solbond_1 = require("./idl/solbond");
const getSolbondProgram = (connection, provider) => {
    const programId = new anchor.web3.PublicKey("3vTbhuwJwR5BadSH9wt29rLf91S57x31ynQZJpG9cf7E");
    const program = new anchor.Program(solbond_1.IDL, programId, provider);
    return program;
};
exports.getSolbondProgram = getSolbondProgram;
