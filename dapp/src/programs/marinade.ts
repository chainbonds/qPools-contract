import * as anchor from "@project-serum/anchor";
import {PROGRAM_ID_MARINADE, PROGRAM_ID_SOLBOND} from "../const";
import {clusterApiUrl, Connection, PublicKey} from "@solana/web3.js";
import {BN, Idl, Program, Provider, Wallet, web3} from "@project-serum/anchor";
import { MarinadeConfig } from "./marinade/modules/marinade-config";
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { MarinadeState } from './marinade/marinade-state/marinade-state';
import { getOrCreateAssociatedTokenAccount, SYSTEM_PROGRAM_ID } from './marinade/util/anchor'
import { MarinadeResult } from './marinade/marinade.types'

//@ts-ignore
import _idl from './../marinade-idl.json';
const idl: any = _idl;

export class Marinade {

    connection: Connection;
    provider: Provider;
    readonly config: MarinadeConfig;

    constructor (_connection: Connection, _provider: Provider) {
        this.connection = _connection;
        this.provider = _provider;

        // Create a new marinade config right here, which should cover most of the logic
        this.config = new MarinadeConfig();
    }

    /**
     * Marina Program
     */
    get marinadeProgram (): Program {

        const programId = new anchor.web3.PublicKey(PROGRAM_ID_MARINADE);
        const program = new anchor.Program(
            idl,
            programId,
            this.provider,
        );

        return program;
    }

    async getMarinadeState (): Promise<MarinadeState> {
        return MarinadeState.fetch(this)
    }

    /**
     * Deposit SOL and get mSOL Marina Logic
     */
    // Promise<MarinadeResult.Deposit>
    async depositInstructions (owner: Wallet, ownerAddress: PublicKey, amountLamports: BN): Promise<any[]> {

        const marinadeState = await this.getMarinadeState()
        let transactionInstructions: any = [];

        console.log("Creating associated token account: ");
        const {
            associatedTokenAccountAddress: associatedMSolTokenAccountAddress,
            createAssociateTokenInstruction,
        } = await getOrCreateAssociatedTokenAccount(this.provider, marinadeState.mSolMintAddress, ownerAddress)

        console.log("Created associated token account: ");

        if (createAssociateTokenInstruction) {
            transactionInstructions.push(createAssociateTokenInstruction)
        }

        console.log("Creating mSOL transaction: ");
        const depositInstruction = await this.marinadeProgram.instruction.deposit(
            amountLamports,
            {
                accounts: {
                    reservePda: await marinadeState.reserveAddress(),
                    state: this.config.marinadeStateAddress,
                    msolMint: marinadeState.mSolMintAddress,
                    msolMintAuthority: await marinadeState.mSolMintAuthority(),
                    liqPoolMsolLegAuthority: await marinadeState.mSolLegAuthority(),
                    liqPoolMsolLeg: marinadeState.mSolLeg,
                    liqPoolSolLegPda: await marinadeState.solLeg(),
                    mintTo: associatedMSolTokenAccountAddress,
                    transferFrom: ownerAddress,
                    systemProgram: SYSTEM_PROGRAM_ID,
                    tokenProgram: TOKEN_PROGRAM_ID,
                },
                signers: [owner.payer]
            }
        )
        console.log("Done mSOL transaction: ");

        transactionInstructions.push(depositInstruction)

        return transactionInstructions

    }


    async liquidUnstake (ownerAddress: PublicKey, amountLamports: BN): Promise<any[]> {

        const marinadeState = await this.getMarinadeState();
        let transactionInstructions: any = [];

        const {
            associatedTokenAccountAddress: associatedMSolTokenAccountAddress,
            createAssociateTokenInstruction,
        } = await getOrCreateAssociatedTokenAccount(this.provider, marinadeState.mSolMintAddress, ownerAddress)

        if (createAssociateTokenInstruction) {
            transactionInstructions.push(createAssociateTokenInstruction)
        }

        const liquidUnstakeInstruction = await this.marinadeProgram.instruction.liquidUnstake(
            amountLamports,
            {
                accounts: {
                    state: this.config.marinadeStateAddress,
                    msolMint: marinadeState.mSolMintAddress,
                    liqPoolMsolLeg: marinadeState.mSolLeg,
                    liqPoolSolLegPda: await marinadeState.solLeg(),
                    getMsolFrom: associatedMSolTokenAccountAddress,
                    getMsolFromAuthority: ownerAddress,
                    transferSolTo: ownerAddress,
                    treasuryMsolAccount: marinadeState.treasuryMsolAccount,
                    systemProgram: SYSTEM_PROGRAM_ID,
                    tokenProgram: TOKEN_PROGRAM_ID,
                },
            }
        )

        transactionInstructions.push(liquidUnstakeInstruction)

        return transactionInstructions
    }

}

// export const marinadeProgram = (connection: Connection, provider: Provider) => {
//
//     const programId = new anchor.web3.PublicKey(PROGRAM_ID_MARINADE);
//     const program = new anchor.Program(
//         idl,
//         programId,
//         provider,
//     );
//
//     return program;
// }


/**
 * Outside our code!
 */

// export class Marinade {
//     async getMarinadeState (): Promise<MarinadeState> {
//         return MarinadeState.fetch(this)
//     }
// }
