/**
 * Introduce a local development variable, that you can use to switch between mainnet and testnet
 * We can first test the API endpoint, then the actual website for any bugs
 */

export enum Cluster {
    DEVNET,
    MAINNET,
    LOCALNET,
}

export const getNetworkCluster = () => {

    // If the local (global) variable is set, return that one.
    // If not, read it from the .env variable

    // Read the .env variable (?)
    console.log("process.env.NEXT_PUBLIC_CLUSTER_NAME ", process.env.NEXT_PUBLIC_CLUSTER_NAME )
    if (process.env.NEXT_PUBLIC_CLUSTER_NAME === "devnet") {
        return Cluster.DEVNET
    } else if (process.env.NEXT_PUBLIC_CLUSTER_NAME === "mainnet") {
        return Cluster.MAINNET
    } else if (process.env.NEXT_PUBLIC_CLUSTER_NAME === "local") {
        return Cluster.LOCALNET
    } else {
        throw Error("Environment variable not found!");
    }
}