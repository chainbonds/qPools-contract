import {BN} from "@project-serum/anchor";
import {PublicKey, Transaction, TransactionInstruction} from "@solana/web3.js";


export const requestComputeBudget = async (computeBudget: BN): Promise<Transaction> => {
    // I guess compute budget should be a slight amount bigger, let's try it with this ...
    const data = Buffer.from(
        Uint8Array.of(0, ...new BN(256000).toArray("le", 4), ...new BN(5_000).toArray("le", 4))
    );
    const additionalComputeBudgetInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey("ComputeBudget111111111111111111111111111111"),
        data,
    });
    const transaction = new Transaction().add(additionalComputeBudgetInstruction);
    return transaction
}