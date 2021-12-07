import { FEE_TIER, Market } from './market'
import { SEED, tou64, DENOMINATOR, signAndSend, sleep, INVARIANT_ERRORS } from './utils'
import { TICK_LIMIT, calculate_price_sqrt, fromInteger, MAX_TICK, MIN_TICK, TICK_SEARCH_RANGE } from './math'
import { PublicKey, Transaction } from '@solana/web3.js'
import { Pair } from './pair'
import { getMarketAddress, Network, MOCK_TOKENS } from './network'

export {
  Market,
  Pair,
  Network,
  getMarketAddress,
  signAndSend,
  sleep,
  calculate_price_sqrt,
  fromInteger,
  tou64,
  SEED,
  INVARIANT_ERRORS,
  DENOMINATOR,
  TICK_LIMIT,
  MAX_TICK,
  MIN_TICK,
  MOCK_TOKENS,
  FEE_TIER,
  TICK_SEARCH_RANGE
}
export interface IWallet {
  signTransaction(tx: Transaction): Promise<Transaction>
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>
  publicKey: PublicKey
}
