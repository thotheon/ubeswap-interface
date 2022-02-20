import { JSBI, Token, TokenAmount } from '@ubeswap/sdk'
import { MENTO_POOL_INFO } from 'constants/mento'
import { CELO } from 'constants/tokens'
import { stableToToken } from 'state/mentoPools/hooks'
import { StableSwapConstants } from 'state/stablePools/reducer'
import { dedupeTokens } from 'utils/tokens'

// Hooks
import { CHAIN } from '../../constants'
import { STATIC_POOL_INFO } from '../../constants/StablePools'
import { useWeb3Context } from '../../hooks'
import { tryParseAmount } from '../swap/hooks'

function inPool(token: Token, pool: StableSwapConstants): boolean {
  return pool.tokens.map((t) => t.address === token.address && t.chainId === token.chainId).includes(true)
}

export function useTokensTradeable(mento: boolean, tokenIn: Token | null | undefined): Token[] {
  if (!tokenIn) return []
  const pools = mento
    ? tokenIn === CELO[CHAIN]
      ? MENTO_POOL_INFO[CHAIN].map((m) => stableToToken(m.stable))
      : [CELO[CHAIN]]
    : STATIC_POOL_INFO[CHAIN].filter((pool) => !pool.disabled && inPool(tokenIn, pool))
        .flatMap(({ tokens }) => tokens)
        .filter((token) => token !== tokenIn)
  return dedupeTokens(pools)
}

// based on typed value
export function useDerivedStakeInfo(
  typedValue: string,
  stakingToken: Token,
  userLiquidityUnstaked: TokenAmount | undefined
): {
  parsedAmount?: TokenAmount
  error?: string
} {
  const { connected } = useWeb3Context()

  const parsedInput: TokenAmount | undefined = tryParseAmount(typedValue, stakingToken)

  const parsedAmount =
    parsedInput && userLiquidityUnstaked && JSBI.lessThanOrEqual(parsedInput.raw, userLiquidityUnstaked.raw)
      ? parsedInput
      : undefined

  let error: string | undefined
  if (!connected) {
    error = 'Connect Wallet'
  }
  if (!parsedAmount) {
    error = error ?? 'Enter an amount'
  }

  return {
    parsedAmount,
    error,
  }
}
