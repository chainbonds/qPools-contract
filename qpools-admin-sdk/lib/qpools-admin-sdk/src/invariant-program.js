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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInvariantProgram = void 0;
const anchor = __importStar(require("@project-serum/anchor"));
// Not sure if this import is allowed...
//@ts-ignore
const amm_json_1 = __importDefault(require("../../solbond/deps/protocol/target/idl/amm.json"));
const invariant_idl = amm_json_1.default;
const getInvariantProgram = (connection, provider) => {
    const programId = new anchor.web3.PublicKey("77yFpTqxesQNz7Styk6yTRBaEcW9LxDKPvA46HfuA77z");
    const program = new anchor.Program(invariant_idl, programId, provider);
    return program;
};
exports.getInvariantProgram = getInvariantProgram;
