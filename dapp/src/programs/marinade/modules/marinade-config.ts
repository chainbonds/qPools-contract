import { web3 } from "@project-serum/anchor"

const loadEnvVariable = (envVariableKey: string, defValue: string): string => process.env[envVariableKey] ?? defValue

export class MarinadeConfig {

  // Can perhaps switch between devnet and mainnet
  marinadeProgramId = new web3.PublicKey("MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD");
  marinadeStateAddress = new web3.PublicKey("8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC");
  // anchorProviderUrl = loadEnvVariable("ANCHOR_PROVIDER_URL", "https://api.mainnet-beta.solana.com");
  anchorProviderUrl = loadEnvVariable("ANCHOR_PROVIDER_URL", "https://api.devnet.solana.com");

  // Wallet is ...
  // TODO: Replace this line, wallet should not be owned by marinade config!
  // wallet = web3.Keypair.generate()

  constructor (configOverrides: Partial<MarinadeConfig> = {}) {
    Object.assign(this, configOverrides)
  }

}
