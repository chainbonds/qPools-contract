/**
 * Introduce a local development variable, that you can use to switch between mainnet and testnet
 * We can first test the API endpoint, then the actual website for any bugs
 */

export enum Cluster {
    DEVNET,
    MAINNET,
}

export const getNetworkCluster = () => {
    // Read the .env variable (?)
    if (process.env.NEXT_PUBLIC_CLUSTER_NAME === "devnet") {
        return Cluster.DEVNET
    } else {
        throw Error("Environment variable not found!");
    }
}