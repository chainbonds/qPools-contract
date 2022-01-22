import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { TokenInstructions } from '@project-serum/serum'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { FeeTier, Market, Position } from '@invariant-labs/sdk/lib/market'
import { Decimal } from '@invariant-labs/sdk/src/market'
import { FEE_TIERS } from '@invariant-labs/sdk/src/utils'
import { fromFee } from '@invariant-labs/sdk/lib/utils'
import { Pair } from '@invariant-labs/sdk'
import { tou64 } from '@invariant-labs/sdk'
import { DENOMINATOR } from '@invariant-labs/sdk'
import { TICK_LIMIT } from '@invariant-labs/sdk'
import {BN} from "@project-serum/anchor";

export async function assertThrowsAsync(fn: Promise<any>, word?: string) {
  try {
    await fn
  } catch (e: any) {
    let err
    if (e.code) {
      err = '0x' + e.code.toString(16)
    } else {
      err = e.toString()
    }
    if (word) {
      const regex = new RegExp(`${word}$`)
      if (!regex.test(err)) {
        console.log(err)
        throw new Error('Invalid Error message')
      }
    }
    return
  }
  throw new Error('Function did not throw error')
}

export const eqDecimal = (x: Decimal, y: Decimal) => {
  return x.v.eq(y.v)
}

export const createToken = async (
  connection: Connection,
  payer: Keypair,
  mintAuthority: Keypair,
  decimals = 6
) => {
  const token = await Token.createMint(
    connection,
    payer,
    mintAuthority.publicKey,
    null,
    decimals,
    TokenInstructions.TOKEN_PROGRAM_ID
  )
  return token
}

// do not compare bump
export const positionEquals = (a: Position, b: Position) => {
  return positionWithoutOwnerEquals(a, b) && a.owner == b.owner
}

export const positionWithoutOwnerEquals = (a: Position, b: Position) => {
  return (
    eqDecimal(a.feeGrowthInsideX, b.feeGrowthInsideX) &&
    eqDecimal(a.feeGrowthInsideY, b.feeGrowthInsideY) &&
    eqDecimal(a.liquidity, b.liquidity) &&
    a.lowerTickIndex == b.lowerTickIndex &&
    a.upperTickIndex == b.upperTickIndex &&
    a.pool.equals(b.pool) &&
    a.id.eq(b.id) &&
    eqDecimal(a.tokensOwedX, b.tokensOwedX) &&
    eqDecimal(a.tokensOwedY, b.tokensOwedY)
  )
}

export const createUserWithTokens = async (
  pair: Pair,
  connection: Connection,
  mintAuthority: Keypair,
  mintAmount: BN = new BN(1e9)
) => {
  const tokenX = new Token(connection, pair.tokenX, TOKEN_PROGRAM_ID, mintAuthority)
  const tokenY = new Token(connection, pair.tokenY, TOKEN_PROGRAM_ID, mintAuthority)

  const owner = Keypair.generate()

  const [userAccountX, userAccountY] = await Promise.all([
    tokenX.createAssociatedTokenAccount(owner.publicKey),
    tokenY.createAssociatedTokenAccount(owner.publicKey),
    connection.requestAirdrop(owner.publicKey, 1e9)
  ])

  await Promise.all([
    tokenX.mintTo(userAccountX, mintAuthority.publicKey, [mintAuthority], tou64(mintAmount)),
    tokenY.mintTo(userAccountY, mintAuthority.publicKey, [mintAuthority], tou64(mintAmount))
  ])

  return { owner, userAccountX, userAccountY }
}

export const setInitialized = (bitmap: number[], index: number) => {
  bitmap[Math.floor((index + TICK_LIMIT) / 8)] |= 1 << (index + TICK_LIMIT) % 8
}

