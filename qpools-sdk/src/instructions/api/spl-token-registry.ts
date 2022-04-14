import splTokenList from '../../registry/mainnet/spl-token-list.json';
import {ExplicitToken} from "../../types/interfacing/ExplicitToken";

export const getSplTokenList = async (): Promise<ExplicitToken[]> => {
    // The Solana Token List is too long (4MB). We use the Saber, as we assume that there will be enough protocols in there for now.
    // let mainnetTokenUri = "https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json";
    // let mainnetTokenUri = "https://registry.saber.so/data/token-list.mainnet.json";
    // let response = await axios.get<any>(mainnetTokenUri);
    let out: ExplicitToken[] = splTokenList["tokens"];
    return out;
}
