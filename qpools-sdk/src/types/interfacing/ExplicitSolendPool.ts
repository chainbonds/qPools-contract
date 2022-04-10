import {ExplicitPool} from "./ExplicitPool";
import {SolendAction} from "@solendprotocol/solend-sdk";

export interface ExplicitSolendPool extends ExplicitPool {
    solendAction: SolendAction
}
