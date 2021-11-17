import {Schema, model, connect, Model} from 'mongoose';

// 1. Create an interface that defines the ImoPool
export interface IImoPool {
    imoName: string;
    imoStart: string;  // Should be string
    imoStakeEnd: string;
    imoEnd: string;

    // TODO: All following types should be Web3.Pubkey s

    // Overarching Pool Address
    imoPoolAddress: string;
    imoPoolAuthorityAddress: string;

    // Token Mint and Pool Address
    imoTokenMintAddress: string;
    imoTokenPoolAccountAddress: string;

    // Usdc Mint and Pool Address
    imoUsdcMintAddress: string;
    imoUsdcPoolAccountAddress: string;

    // Redeemable Mint and Pool Address
    imoRedeemableMintAddress: string;
};

// 2. Create a schema that corresponds to the document interface
const schema = new Schema<IImoPool>({
    imoName: { type: String, required: true, unique: true },
    imoStart: { type: String, required: true },
    imoStakeEnd: { type: String, required: true },
    imoEnd: { type: String, required: true },
    imoPoolAddress: { type: String, required: true},
    imoPoolAuthorityAddress: { type: String, required: true },
    imoTokenMintAddress: { type: String, required: true },
    imoTokenPoolAccountAddress: { type: String, required: true },
    imoUsdcMintAddress: { type: String, required: true },
    imoUsdcPoolAccountAddress: { type: String, required: true },
    imoRedeemableMintAddress: { type: String, required: true },
});

// 3. Create a model
const ImoPool: Model<IImoPool, {}, {}> = model<IImoPool>('ImoPool', schema, "imo");

export default ImoPool;
