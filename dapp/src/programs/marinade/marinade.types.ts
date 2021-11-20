import { web3 } from '@project-serum/anchor'

export namespace MarinadeResult {

  export interface Deposit {
    associatedMSolTokenAccountAddress: web3.PublicKey
    transactionSignature: string
  }

  export interface LiquidUnstake {
    associatedMSolTokenAccountAddress: web3.PublicKey
    transactionSignature: string
  }
}
