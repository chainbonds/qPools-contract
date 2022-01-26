import {Connection, Keypair, PublicKey, Signer} from "@solana/web3.js";
import {BN, Program, Provider, utils, web3} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import * as net from "net";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {assert} from "chai";
import {QPoolsAdmin} from "./qpools-admin";
import {QPair} from "@qpools/sdk/src/q-pair";
import {createToken} from "./invariant-utils";
import {getAssociatedTokenAddress} from "easy-spl/dist/tx/associated-token-account";
import {getPayer} from "@qpools/sdk";

// some invariant seeds
const POSITION_SEED = 'positionv1'
const TICK_SEED = 'tickv1'
const POSITION_LIST_SEED = 'positionlistv1'

// Probably put into a separate file, so we can outsource the SDK into a separate set of imports ...
export class MockQPools extends QPoolsAdmin {

    public tokens: Token[];

    // TODO: Number pools should be part of the constructor!
    async createTokens(number_pools: number, mintAuthority: Keypair) {
        // Every second token should be the same!
        this.tokens = await Promise.all(
            Array.from({length: number_pools}).map((_) => {
                return createToken(this.connection, this.wallet, mintAuthority)
            })
        );
        // Assert
        assert.ok(this.tokens.map((token: Token) => {
            return token.getMintInfo().then((mintInfo) => {return mintInfo.mintAuthority.equals(mintAuthority.publicKey)})
        }));
        assert.ok(this.tokens.length == number_pools);
    }

}
