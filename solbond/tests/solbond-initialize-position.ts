import * as anchor from '@project-serum/anchor';
import {Program, Provider, BN, web3} from '@project-serum/anchor';
import {Keypair, PublicKey, Transaction} from '@solana/web3.js';
import { Network, SEED, Market, Pair } from '@invariant-labs/sdk';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { createToken } from './invariant-utils';
import { assert } from 'chai';
import { DENOMINATOR } from '@invariant-labs/sdk';
import { TICK_LIMIT } from '@invariant-labs/sdk';
import { tou64 } from '@invariant-labs/sdk';
import { fromFee } from '@invariant-labs/sdk/lib/utils';
import { FeeTier, Decimal } from '@invariant-labs/sdk/lib/market';
import { toDecimal } from '@invariant-labs/sdk/src/utils';
import {createMint, getPayer} from "./utils";
import {solbondProgram} from "../../dapp/src/programs/solbond";
import {invariantAmmProgram} from "./external_programs/invariant_amm";

const NUMBER_POOLS = 5;


describe('claim', () => {
    const provider = provider.local();
    const connection = provider.connection;

    const solbondProgram = anchor.workspace.Solbond;
    const invariantProgram = anchor.workspace.Amm;
    const payer = getPayer();
    let allPairs: Pair[];
    let allTokens: Token[];

    const wallet = provider.wallet.payer as Keypair;
    const mintAuthority = Keypair.generate();
    const positionOwner = Keypair.generate();
    const admin = Keypair.generate();
    const market = new Market(
        Network.LOCAL,
        provider.wallet,
        connection,
        anchor.workspace.Amm.programId
    )
    const feeTier: FeeTier = {
        fee: fromFee(new BN(600)),
        tickSpacing: 10,
    };
    const protocolFee: Decimal = { v : fromFee(new BN(10000))}
    let tokenX: Token;
    let tokenY: Token;
    let programAuthority: PublicKey;
    let nonce: number;


    before( async () => {
        await Promise.all([
            await connection.requestAirdrop(mintAuthority.publicKey, 1e9),
            await connection.requestAirdrop(admin.publicKey, 1e9),
            await connection.requestAirdrop(positionOwner.publicKey, 1e9),
        ])
        allTokens = await Promise.all(Array.from({length: 2*NUMBER_POOLS}).map((_) => {
            return createToken(connection, wallet, mintAuthority);
        }));
        const swaplineProgram = anchor.workspace.Amm as Program;
        const [_programAuthority, _nonce] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from(SEED)],
            swaplineProgram.programId
        )
        nonce = _nonce;
        programAuthority = _programAuthority;

        let i = 0;
        allPairs = Array.from({length: NUMBER_POOLS}).map((_) => {
            let pair = new Pair(allTokens[2*i].publicKey, allTokens[(2*i)+1].publicKey, feeTier);
            i++;
            return pair;
        });

    })

    let bumpRegisterPosition: number | null = null;
    let currIdx: number = 0;
    let maxIdx: number = 5;
    let weight: number = 0.2;
    let pool: PublicKey | null = null;
    let state: PublicKey | null = null;
    let tickmap: PublicKey | null = null;
    let token_currency_mint: Token | null = null;
    let token_x_mint: Token | null = null;
    let pool_token_currency_address: PublicKey | null = null;
    let pool_token_x_address: PublicKey | null = null;
    let qpool_token_currency_address: PublicKey | null = null;
    let qpool_token_x_address: PublicKey | null = null;
    let position_in_pool: PublicKey | null = null;
    let position_list_in_pool: PublicKey | null = null;
    let upper_tick: PublicKey | null = null;
    let lower_tick: PublicKey | null = null;


    let invariantPoolAccount: PublicKey | null = null;

    it("#RegisterPositionInstruction()", async () => {

        await provider.connection.requestAirdrop(payer.publicKey, 100*1e9);
        let pair = allPairs[0];
        await market.create({
            pair,
            signer: admin
        })
        const createdPool = await market.get(pair);
        token_currency_mint = await createMint(provider, payer);
        token_x_mint = await createMint(provider, payer);
        const tokenX = new Token(connection, pair.tokenX, TOKEN_PROGRAM_ID, wallet)
        const tokenY = new Token(connection, pair.tokenY, TOKEN_PROGRAM_ID, wallet)
        const tickmapData = await market.getTickmap(pair);
        console.log("Lemon Squeeze");
        console.log("invariantPoolAccount${currIdx}");
        // Create the bondPoolAccount as a PDA
        [invariantPoolAccount, bumpRegisterPosition] = await PublicKey.findProgramAddress(
            [payer.publicKey.toBuffer(), Buffer.from(anchor.utils.bytes.utf8.encode("invariantPoolAccount${currIdx}"))],
            invariantProgram.programId
        );
        const initTX = await solbondProgram.rpc.registerPositionInstruction(
            bumpRegisterPosition,
            currIdx,
            maxIdx,
            weight,
            {
                accounts: {
                    invariantPoolAccount: invariantPoolAccount,
                    poolAddress: pool,
                    tickMap: tickmapData,
                    state: state,
                    currencyTokenMint:token_currency_mint,
                    tokenXMint: token_x_mint,
                    reserveCurrencyToken: pool_token_currency_address,
                    reserveX: pool_token_x_address,
                    accountCurrencyReserve: qpool_token_currency_address,
                    accountXReserve: qpool_token_x_address,
                    initializer: payer,
                    positionInPool: position_in_pool,
                    positionListInPool: position_list_in_pool,
                    upperTick: upper_tick,
                    lowerTick: lower_tick,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,

                },
                signers: [payer]
            }

        );
        await provider.connection.confirmTransaction(initTX);


    })

} )