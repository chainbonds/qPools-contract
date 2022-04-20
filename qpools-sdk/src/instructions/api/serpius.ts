import {Cluster, getNetworkCluster} from "../../network";

export const getSerpiusUrl = (): string => {

    let url: string
    if (getNetworkCluster() === Cluster.DEVNET) {
        return "https://qpools.serpius.com/weight_status_v3_no_port_devnet.json"
    } else if (getNetworkCluster() === Cluster.MAINNET) {
        return "https://qpools.serpius.com/weight_status_v3_no_port.json"
    } else {
        throw Error("Cluster not implemented! getSolendPools");
    }
}