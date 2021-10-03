import { JSBI, Percent, Token, TokenAmount } from '@ubeswap/sdk'
import { useMobi, useVeMobi } from 'hooks/Tokens'
import { useSelector } from 'react-redux'
import { AppState } from 'state'
import { getPoolInfo } from 'state/stablePools/hooks'
import { StableSwapPool } from 'state/stablePools/reducer'
import { getDepositValues } from 'utils/stableSwaps'

import { StakingState } from './reducer'

export type GaugeSummary = {
  pool: string
  address: string
  baseBalance: TokenAmount
  totalStaked: TokenAmount
  unclaimedMobi: TokenAmount
  firstToken: Token
  currentWeight: Percent
  workingBalance: TokenAmount
  totalWorkingBalance: TokenAmount
  workingPercentage: Percent
  actualPercentage: Percent
  lastVote: Date
}

export type MobiStakingInfo = {
  votingPower: TokenAmount
  totalVotingPower: TokenAmount
  mobiLocked?: TokenAmount
  lockEnd?: Date
  positions?: GaugeSummary[]
}

export function calculateBoostedBalance(
  votingPower: JSBI,
  totalVotingPower: JSBI,
  liquidity: JSBI,
  totalLiquidity: JSBI
): JSBI {
  let boosted = JSBI.BigInt('0')
  if (!JSBI.equal(totalVotingPower, JSBI.BigInt('0')))
    boosted = JSBI.add(
      JSBI.divide(JSBI.multiply(JSBI.BigInt(4), liquidity), JSBI.BigInt(10)),
      JSBI.divide(
        JSBI.multiply(JSBI.BigInt(6), JSBI.multiply(totalLiquidity, votingPower)),
        JSBI.multiply(totalVotingPower, JSBI.BigInt(10))
      )
    )
  return JSBI.greaterThan(boosted, liquidity) ? boosted : liquidity
}

export function useMobiStakingInfo(): MobiStakingInfo {
  const stakingInfo = useSelector<AppState, StakingState>((state) => state.staking)
  const pools = useSelector<AppState, StableSwapPool[]>((state) => {
    const allPools = state.stablePools.pools
    return Object.values(allPools).map(({ pool }) => pool)
  })
  const veMobi = useVeMobi()
  const mobi = useMobi()
  const baseInfo: MobiStakingInfo = {
    votingPower: new TokenAmount(veMobi, stakingInfo.votingPower),
    totalVotingPower: new TokenAmount(veMobi, stakingInfo.totalVotingPower),
    mobiLocked: new TokenAmount(mobi, stakingInfo.locked?.amount ?? '0'),
    lockEnd: stakingInfo.locked ? new Date(stakingInfo.locked.end) : undefined,
  }
  if (pools && pools.length === 0) {
    return baseInfo
  }
  const positions = pools.map((pool) => ({
    pool: pool.name,
    address: pool.gaugeAddress ?? '',
    baseBalance: new TokenAmount(pool.lpToken, pool.staking?.userStaked ?? '0'),
    totalStaked: new TokenAmount(pool.lpToken, pool.staking?.totalStakedAmount ?? '0'),
    boostedBalance: new TokenAmount(
      pool.lpToken,
      calculateBoostedBalance(
        stakingInfo.votingPower,
        stakingInfo.totalVotingPower,
        pool.staking?.userStaked ?? JSBI.BigInt('0'),
        pool.staking?.totalStakedAmount ?? JSBI.BigInt('1')
      )
    ),
    unclaimedMobi: new TokenAmount(mobi, pool.staking?.pendingMobi ?? '0'),
    firstToken: pool.tokens[0],
    currentWeight: pool.poolWeight,
    workingBalance: new TokenAmount(pool.lpToken, pool.effectiveBalance),
    totalWorkingBalance: new TokenAmount(pool.lpToken, pool.totalEffectiveBalance),
    workingPercentage: new Percent(pool.effectiveBalance, pool.totalEffectiveBalance),
    actualPercentage: new Percent(pool.staking?.userStaked ?? '0', pool.staking?.totalStakedAmount ?? '1'),
    lastVote: new Date(pool.lastUserVote * 1000),
  }))
  return {
    ...baseInfo,
    positions,
  }
}

export function usePriceOfDeposits() {
  const pools = useSelector<AppState, StableSwapPool[]>((state) => {
    const allPools = state.stablePools.pools
    return Object.values(allPools)
      .map(({ pool }) => pool)
      .filter((pool) => pool.staking && JSBI.greaterThan(pool.staking.userStaked, JSBI.BigInt('0')))
  })
  const prices = useSelector((state: AppState) => ({
    ethPrice: state.application.ethPrice,
    btcPrice: state.application.btcPrice,
  }))
  const dummyToken = useMobi()
  return new TokenAmount(
    dummyToken,
    pools.reduce((accum, pool) => {
      const address = pool.address
      const { valueOfDeposited } = getDepositValues(getPoolInfo(pool))
      const price =
        address === '0x19260b9b573569dDB105780176547875fE9fedA3'
          ? JSBI.BigInt(prices.btcPrice)
          : address === '0xE0F2cc70E52f05eDb383313393d88Df2937DA55a'
          ? JSBI.BigInt(prices.ethPrice)
          : JSBI.BigInt('1')
      return JSBI.add(accum, JSBI.multiply(valueOfDeposited.raw, price))
    }, JSBI.BigInt('0'))
  )
}

export function useLockEnd(): number {
  const lockEnd = useSelector<AppState, number>((state) => state.staking?.locked?.end ?? 0)
  return lockEnd
}

export function useVotePowerLeft(): number {
  const votePower = useSelector<AppState, JSBI>((state) => state.staking.voteUserPower)
  return (10000 - parseInt(votePower.toString())) / 100
}