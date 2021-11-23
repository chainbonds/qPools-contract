import {Schema, model, connect, Model} from 'mongoose';

// 1. Create an interface that defines the BondPool
// Instead of string, should maybe be of type web3.Pubkey
export interface IBondPool {

    // user to backtrack (could maybe also be done by running backgrounds)
    user: string,

    // Amounts / Variables
    bump: number,
    bondTimeFrame: number,
    sendAmount: number,

    // Accounts
    bondAccount: string,
    bondAuthority: string,
    initializer: string,
    initializerTokenAccount: string,
    bondTokenAccount: string,
    bondSolanaAccount: string,
    redeemableMint: string,

    // This stuff is probably not needed to store here, because it's system programs
    // rent: string,
    // clock: string,
    // systemProgram: string,
    // tokenProgram: string,

};

// 2. Create a schema that corresponds to the document interface
const schema = new Schema<IBondPool>({

    // user to backtrack (could maybe also be done by running backgrounds)
    user: { type: String, required: true },

    // Amounts / Variables
    bump: { type: Number, required: true },
    bondTimeFrame: { type: Number, required: true },
    sendAmount: { type: Number, required: true },

    // Accounts
    bondAccount: { type: String, required: true, unique: true },

    bondAuthority: { type: String, required: true },
    initializer: { type: String, required: true },
    initializerTokenAccount: { type: String, required: true },
    bondTokenAccount: { type: String, required: true },
    bondSolanaAccount: { type: String, required: true },
    redeemableMint: { type: String, required: true },

    // Again, probably not needed because system addresses
    // rent: { type: String, required: true },
    // clock: { type: String, required: true },
    // systemProgram: { type: String, required: true },
    // tokenProgram: { type: String, required: true },

});

// 3. Create a model
const BondPool: Model<IBondPool, {}, {}> = model<IBondPool>('BondPool', schema, "bonds");

export default BondPool;
