import {PositionAccountSaber} from "../types/account/positionAccountSaber";
import {accountExists, getAccountForMintAndPDADontCreate} from "../utils";
import {Connection, Keypair, PublicKey, TransactionInstruction} from "@solana/web3.js";
import {BN, Program, web3} from "@project-serum/anchor";
import {TOKEN_PROGRAM_ID, u64} from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import {getPositionPda, getPortfolioPda} from "../types/account/pdas";
import * as registry from "../registry/registry-helper";
import {findSwapAuthorityKey, StableSwap} from "@saberhq/stableswap-sdk";
import * as assert from "assert";
import {MOCK} from "../const";

/**
 * Any constants.
 * You should probably include these in the registry.
 */
// TODO: Put this into the registry!
export const stableSwapProgramId = new PublicKey("SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ");
