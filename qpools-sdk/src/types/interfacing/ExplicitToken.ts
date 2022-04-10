import {PythStruct} from "./PythStruct";

export interface ExplicitToken {
    address: string,
    decimals: number
    logoURI: string
    name: string,
    symbol: string,
    pyth?: PythStruct
}