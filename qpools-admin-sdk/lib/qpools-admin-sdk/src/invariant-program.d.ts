import * as anchor from "@project-serum/anchor";
import { Connection } from "@solana/web3.js";
import { Provider } from "@project-serum/anchor";
export declare const getInvariantProgram: (connection: Connection, provider: Provider) => anchor.Program<any>;
