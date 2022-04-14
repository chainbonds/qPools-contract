import {StableSwap} from "@saberhq/stableswap-sdk";
import {ExplicitPool} from "./ExplicitPool";

export interface ExplicitSaberPool extends ExplicitPool {
    swap: StableSwap
}
