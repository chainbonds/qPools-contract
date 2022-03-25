import {Connection, GetProgramAccountsFilter, PublicKey} from "@solana/web3.js";
import {Program, ProgramAccount} from "@project-serum/anchor";
import {UserCurrencyAccount} from "../../types/account/userCurrencyAccount";
import {getUserCurrencyPda} from "../../types/account/pdas";

/**
 * Check if the portfolio exists
 */
export async function getTotalInputAmount(
    connection: Connection,
    solbondProgram: Program,
    owner: PublicKey
): Promise<UserCurrencyAccount[]> {
    console.log("#portfolioExists");

    if (!owner) {
        console.log(owner);
        console.assert(false);
        throw Error("Owner is empty: ");
    }

    let allUserCurrencyAccounts: Map<PublicKey, UserCurrencyAccount> = new Map<PublicKey, UserCurrencyAccount>();

    // First couple bytes of the filter are the user in bytes
    // Just do it the dirty way right now ...
    // First 8 bytes of a program are reserved for some stuff... Idk what again.
    let ownerBytes: GetProgramAccountsFilter[] = [{
        memcmp: {bytes: owner.toBase58(), offset: 8}
    }];
    let response = await solbondProgram.account.userCurrencyAccount.all(ownerBytes);
    response.map((x) => {
        allUserCurrencyAccounts.set(x.publicKey, x.account as UserCurrencyAccount);
        // return x.account as UserCurrencyAccount
    });
    // response
    // let allUserCurrencyAccounts: UserCurrencyAccount[] = response.map((x) => {return x.account as UserCurrencyAccount});
    // let response = await solbondProgram.account.userCurrencyAccount.all();
    // let allUserCurrencyAccounts: UserCurrencyAccount[] = response.map((x) => {return x.account as UserCurrencyAccount});
    // allUserCurrencyAccounts = allUserCurrencyAccounts.filter((x: UserCurrencyAccount) => x.owner.equals(owner));
    // allUserCurrencyAccounts.map((x) => {
    //     console.log("Owner is parsed as: ", x);
    //     console.log("Owner is parsed as: ", x.owner);
    //     console.log("Owner is parsed as: ", x.owner.toString());
    // })

    // Filter out unique accounts, by taking the owner, the currency mint (from above), and the seed!
    let allMints: Set<PublicKey> = new Set(Array.from(allUserCurrencyAccounts.values()).map((x) => x.mint));
    // for all the mints, re-create the accounts, and pick the accounts that were initially done.

    // Also, perhaps you wanna write some function that just get's all accounts form scratch, at the beginning of loading the program


    // allUserCurrencyAccounts.entries(([key: PublicKey, value: UserCurrencyAccount]) => {
    //     let [pda, _] = await getUserCurrencyPda(solbondProgram, owner, value.mint);
    //     if (key.equals(pda)) {
    //         out.push(pda);
    //     }
    // })
    let out: UserCurrencyAccount[] = await Promise.all(allUserCurrencyAccounts.filter(async ([key, value]) => {
        let [pda, _] = await getUserCurrencyPda(solbondProgram, owner, value.mint);
        if (key.equals(pda)) {
            return value;
        }
    })).values();

    console.log("All currency accounts are: ", allUserCurrencyAccounts);
    // Now filter out only those addresses that have the right seed as well ...
    console.log("##portfolioExists");
    return out;
}
