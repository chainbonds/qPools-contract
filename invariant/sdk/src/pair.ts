import { PublicKey } from '@solana/web3.js'
import { utils } from '@project-serum/anchor'
import { FeeTier } from './market'
import { getFeeTierAddress } from './utils'

const POOL_SEED = 'poolv1'

export class Pair {
  public tokenX: PublicKey
  public tokenY: PublicKey
  public feeTier: FeeTier
  public feeTierAddress: PublicKey | null
  constructor(first: PublicKey, second: PublicKey, feeTier: FeeTier) {
    if (first.equals(second)) {
      throw new Error('Pair must contain two unique public keys')
    }

    if (first.toString() < second.toString()) {
      this.tokenX = first
      this.tokenY = second
    } else {
      this.tokenX = second
      this.tokenY = first
    }
    this.feeTier = feeTier
    this.feeTierAddress = null
  }

  async getAddressAndBump(programId: PublicKey): Promise<[PublicKey, number]> {
    const feeTierAddress = await this.getFeeTierAddress(programId)

    return PublicKey.findProgramAddress(
      [
        Buffer.from(utils.bytes.utf8.encode(POOL_SEED)),
        feeTierAddress.toBuffer(),
        this.tokenX.toBuffer(),
        this.tokenY.toBuffer()
      ],
      programId
    )
  }

  async getAddress(programId: PublicKey): Promise<PublicKey> {
    return this.getAddressAndBump(programId).then(([address, _]) => address)
  }

  async getFeeTierAddress(programId: PublicKey) {
    if (this.feeTierAddress == null) {
      const { address: feeTierAddress } = await getFeeTierAddress(this.feeTier, programId)
      this.feeTierAddress = feeTierAddress
    }
    return this.feeTierAddress
  }
}
