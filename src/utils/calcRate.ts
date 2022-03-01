import JSBI from 'jsbi'
import { Fraction } from 'lib/token-utils'

import { weiScale } from '../constants'

type Rates = {
  apr: Fraction
  dpr: Fraction
  apy: Fraction
}

export function calcRates(rewardPerYear: Fraction, totalStakedAmount: Fraction): Rates {
  const apr = !totalStakedAmount.equalTo(0) ? rewardPerYear.divide(totalStakedAmount) : new Fraction(0)
  const dpr = apr.divide(365)
  const apy = new Fraction(JSBI.exponentiate(dpr.add(1).multiply(weiScale).quotient, JSBI.BigInt(364)), weiScale)
  return { apr, dpr, apy }
}