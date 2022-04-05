import {Protocol, ProtocolType} from "./PositionInfo";
import {ExplicitToken} from "./ExplicitToken";

export interface ExplicitPool {
    id: string,
    name: string,
    protocol: Protocol,
    protocolType: ProtocolType,
    lpToken: ExplicitToken,
    tokens: ExplicitToken[],  // Should only be used to get the addresses, nothing more // Or we should update it on-the-fly
}
