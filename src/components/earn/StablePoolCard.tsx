import { cUSD, Fraction, JSBI, Percent, Price, TokenAmount } from '@ubeswap/sdk'
import QuestionHelper from 'components/QuestionHelper'
import { ChainLogo } from 'constants/StablePools'
import { useActiveContractKit } from 'hooks'
import { useMobi } from 'hooks/Tokens'
import { darken } from 'polished'
import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useEthBtcPrice } from 'state/application/hooks'
import styled from 'styled-components'
import { getDepositValues } from 'utils/stableSwaps'
import useCUSDPrice from 'utils/useCUSDPrice'

import { BIG_INT_SECONDS_IN_WEEK, BIG_INT_SECONDS_IN_YEAR } from '../../constants'
import { useColor, usePoolColor } from '../../hooks/useColor'
import { StablePoolInfo } from '../../state/stablePools/hooks'
import { StyledInternalLink, theme, TYPE } from '../../theme'
import { ButtonPrimary } from '../Button'
import { AutoColumn } from '../Column'
import CurrencyPoolLogo from '../CurrencyPoolLogo'
import Logo from '../Logo'
import { Row, RowBetween, RowFixed } from '../Row'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'

const SubHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  padding-top: 0;
`

const Divider = styled.div`
  width: 100%;
  height: 1px;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  background: ${({ theme }) => theme.bg4};
`

const StyledButton = styled(ButtonPrimary)<{ background: any; backgroundHover: any }>`
  background: ${({ background }) => background};
  flex: 0.6;
  &:hover {
    background: ${({ background }) => darken(0.1, background)};
  }
`

const StatContainer = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 1rem;
  margin-right: 1rem;
  margin-left: 1rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
`};
`

const InfoContainer = styled.div`
  display: flex;
  align-items: flex-end;
  width: 100%;
  padding: 0px;
  margin-top: 16px;
`
const Bottom = styled.div`
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding-left: 1rem;
  padding-right: 1rem;
`

// background: ${({ bgColor1, bgColor2 }) =>
// `radial-gradient(91.85% 100% at 1.84% 0%, ${bgColor1} 0%, ${bgColor2} 100%) `};

const Wrapper = styled(AutoColumn)<{ showBackground: boolean; background: any }>`
  border-radius: 20px;
  width: 100%;
  overflow: hidden;
  position: relative;
  padding: 1rem;
  background: ${({ theme }) => theme.bg1};
  color: ${({ theme }) => theme.text1} !important;
  ${({ showBackground }) =>
    showBackground &&
    `  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);`}
  ${({ theme }) => theme.mediaWidth.upToSmall`
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  max-width: 420px;
`}
`

const TopSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  padding-bottom: 0.25rem;
  padding-top: 0;
  z-index: 1;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 48px 1fr 96px;
  `};
`
const SecondSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  padding-bottom: 0.25rem;
  padding-top: 0;
  z-index: 1;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 48px 1fr 96px;
  `};
`

const StyledLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  background-color: ${({ theme }) => theme.white};
`

const DepositWithdrawBtn = styled(StyledButton)`
  width: 40%;
  flex: none;
`

//TODO: Fix so when open it expands to the whole row
const ExpandedRow = styled(Row)<{ open: boolean }>`
  justify-content: ${({ open }) => !open && 'space-between'};
  width: 100%;
`

const StyledNavLink = styled(NavLink)<{ color: string }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  color: ${({ color }) => color};
  font-size: 20;
  width: fit-content;
  font-weight: 800;
  paddingLeft: '.15rem',
  textDecoration: underline,
`

interface Props {
  poolInfo: StablePoolInfo
}

export const StablePoolCard: React.FC<Props> = ({ poolInfo }: Props) => {
  const { account, chainId } = useActiveContractKit()
  const {
    tokens,
    peggedTo,
    balances,
    totalDeposited,
    stakedAmount,
    workingSupply,
    pegComesAfter,
    feesGenerated,
    mobiRate,
    displayDecimals,
    totalStakedAmount: totalStakedLPs,
  } = poolInfo

  const [openDeposit, setOpenDeposit] = useState(false)
  const [openWithdraw, setOpenWithdraw] = useState(false)
  const [openManage, setOpenManage] = useState(false)

  const mobi = useMobi()
  const priceOfMobi = useCUSDPrice(mobi) ?? new Price(mobi, cUSD[chainId], '100', '1')
  const userLP = poolInfo.amountDeposited
  const { totalValueStaked, totalValueDeposited, valueOfDeposited } = getDepositValues(poolInfo, workingSupply)
  const coinPrice = useEthBtcPrice(poolInfo.poolAddress)
  const totalStakedAmount = totalValueStaked
    ? new Fraction(
        JSBI.multiply(totalValueStaked.raw, coinPrice),
        JSBI.exponentiate(JSBI.BigInt('10'), JSBI.BigInt('18'))
      )
    : new Fraction(JSBI.BigInt(0))
  const totalMobiRate = new TokenAmount(mobi, mobiRate ?? JSBI.BigInt('0'))
  let userMobiRate = new TokenAmount(mobi, JSBI.BigInt('0'))
  if (account && mobiRate && totalStakedLPs && totalStakedLPs.greaterThan('0')) {
    userMobiRate = new TokenAmount(mobi, poolInfo.workingPercentage.multiply(mobiRate ?? '0').toFixed(0))
  }
  let userExternalRates: TokenAmount[] = []
  if (account && poolInfo.externalRewardRates && totalStakedLPs && totalStakedLPs.greaterThan('0')) {
    userExternalRates = poolInfo.externalRewardRates.map(
      (rate) => new TokenAmount(rate.token, poolInfo.workingPercentage.multiply(rate.raw).toFixed(0))
    )
  }
  let rewardPerYear = priceOfMobi.raw.multiply(totalMobiRate.multiply(BIG_INT_SECONDS_IN_YEAR))
  for (let i = 0; i < 8; i++) {
    const rate = poolInfo.externalRewardRates?.[i] ?? totalMobiRate
    // eslint-disable-next-line
    const priceOfToken = useCUSDPrice(rate.token)
    if (poolInfo.externalRewardRates && i < poolInfo.externalRewardRates.length) {
      rewardPerYear = rewardPerYear.add(priceOfToken?.raw.multiply(rate.multiply(BIG_INT_SECONDS_IN_YEAR)) ?? '0')
    }
  }
  const apyFraction =
    mobiRate && totalStakedAmount && !totalStakedAmount.equalTo(JSBI.BigInt(0))
      ? rewardPerYear.multiply(JSBI.exponentiate(JSBI.BigInt('10'), JSBI.BigInt('18'))).divide(totalStakedAmount)
      : undefined
  const apy = apyFraction
    ? new Percent(
        apyFraction.numerator,
        JSBI.multiply(apyFraction.denominator, JSBI.exponentiate(JSBI.BigInt('10'), JSBI.BigInt('18')))
      )
    : undefined

  const dpy = apy
    ? new Percent(Math.floor(parseFloat(apy.divide('365').toFixed(10)) * 1_000_000).toFixed(0), '1000000')
    : undefined

  let weeklyAPY: React.ReactNode | undefined = <>🤯</>
  try {
    weeklyAPY = apy
      ? new Percent(
          Math.floor(parseFloat(apy.divide('52').add('1').toFixed(10)) ** 52 * 1_000_000 - 1_000_000).toFixed(0),
          '1000000'
        ).toFixed(0, { groupSeparator: ',' })
      : undefined
  } catch (e) {
    console.error('Weekly apy overflow', e)
  }
  let userBalances: TokenAmount[] = []
  if (totalDeposited.greaterThan('0')) {
    userBalances = balances.map((amount) => {
      const fraction = new Fraction(userLP ? userLP.raw : JSBI.BigInt(0), totalDeposited.raw)
      const ratio = fraction.multiply(amount.raw)
      return new TokenAmount(amount.currency, JSBI.divide(ratio.numerator, ratio.denominator))
    })
  }
  const totalVolume = new TokenAmount(poolInfo.lpToken, JSBI.multiply(feesGenerated.raw, JSBI.BigInt('10000')))

  // get the color of the token
  const backgroundColorStart = useColor(tokens[0])
  let backgroundColorEnd = useColor(tokens[tokens.length - 1])
  const poolColor = usePoolColor(poolInfo)
  const backgroundGradient = null //generateGradient(tokens.slice())

  if (!backgroundColorEnd || backgroundColorEnd === backgroundColorStart) backgroundColorEnd = '#212429'

  // get the USD value of staked WETH
  // const apyFraction = poolInfo.apr || undefined
  // const apy = apyFraction ? new Percent(apyFraction.numerator, apyFraction.denominator) : undefined
  const isStaking = valueOfDeposited.greaterThan(JSBI.BigInt('0')) || poolInfo.stakedAmount.greaterThan('0')

  const formatNumber = (num: string) => {
    return num.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  }
  return (
    <Wrapper
      showBackground={true}
      background={backgroundGradient}
      bgColor1={backgroundColorStart}
      bgColor2={backgroundColorEnd}
      onClick={() => setOpenManage(!openManage)}
    >
      {openDeposit && <DepositModal isOpen={openDeposit} onDismiss={() => setOpenDeposit(false)} poolInfo={poolInfo} />}
      {openWithdraw && (
        <WithdrawModal isOpen={openWithdraw} onDismiss={() => setOpenWithdraw(false)} poolInfo={poolInfo} />
      )}
      <TopSection>
        <RowFixed style={{ gap: '10px' }}>
          <TYPE.black fontWeight={600} fontSize={[18, 24]}>
            {poolInfo.name}
          </TYPE.black>
          <StyledLogo size={'32px'} srcs={[ChainLogo[poolInfo.displayChain]]} alt={'logo'} />
        </RowFixed>
        {apy ? (
          <RowFixed>
            <QuestionHelper
              text={
                <>
                  Yield/day: {dpy?.toSignificant(4)}%<br />
                  APY (weekly compounded): {weeklyAPY}%
                </>
              }
            />
            <TYPE.subHeader
              style={{ paddingLeft: '.15rem' }}
              color={poolColor}
              className="apr"
              fontWeight={800}
              fontSize={[18, 24]}
            >
              {apy.denominator.toString() !== '0' ? `${apy.toFixed(1, { groupSeparator: ',' })}%` : ' -'} APR
            </TYPE.subHeader>
          </RowFixed>
        ) : (
          feesGenerated && (
            <TYPE.subHeader color={backgroundColorStart} className="apr" fontWeight={800} fontSize={[14, 18]}>
              Fees Generated: {pegComesAfter ? '' : peggedTo}
              {feesGenerated.denominator.toString() !== '0'
                ? `${feesGenerated.toFixed(displayDecimals, { groupSeparator: ',' })}`
                : '-'}
              {pegComesAfter ? peggedTo : ''}
            </TYPE.subHeader>
          )
        )}
      </TopSection>
      <SecondSection>
        <RowFixed>
          <CurrencyPoolLogo tokens={tokens.slice()} size={24} margin={true} />
          <TYPE.darkGray fontWeight={450} fontSize={[14, 20]}>
            {tokens.map((t) => t.symbol).join(' / ')}
          </TYPE.darkGray>
          {poolInfo.meta && (
            <QuestionHelper
              text={
                <>
                  A meta pool pairs one token with the LP token of another pool to build on already-existing liquidity.{' '}
                  <br />
                  <br />
                  This meta pool builds off of {poolInfo.meta}
                </>
              }
            />
          )}
        </RowFixed>
        {apy ? (
          <RowFixed>
            <QuestionHelper text={'APR after staking MOBI'} />
            <StyledNavLink color={poolColor} to={'/stake'} className="bapr">
              {apy.denominator.toString() !== '0'
                ? `${apy.multiply(new Fraction(JSBI.BigInt(500), JSBI.BigInt(2))).toFixed(1, { groupSeparator: ',' })}%`
                : ' -'}{' '}
              with boost
            </StyledNavLink>
          </RowFixed>
        ) : feesGenerated ? (
          <TYPE.subHeader color={backgroundColorStart} className="apr" fontWeight={800} fontSize={[14, 18]}>
            Fees Generated: {pegComesAfter ? '' : peggedTo}
            {feesGenerated.denominator.toString() !== '0'
              ? `${feesGenerated.toFixed(displayDecimals, { groupSeparator: ',' })}`
              : '-'}
            {pegComesAfter ? peggedTo : ''}
          </TYPE.subHeader>
        ) : (
          <TYPE.black fontWeight={600} fontSize={[14, 18]}>
            Coming Soon!
          </TYPE.black>
        )}
      </SecondSection>
      <InfoContainer>
        <div style={{ flex: 3, width: '100%' }}>
          <ExpandedRow open={openManage}>
            <StatContainer>
              <RowBetween>
                <TYPE.darkGray>Total deposited</TYPE.darkGray>
                <RowFixed>
                  <QuestionHelper
                    text={balances
                      .map(
                        (balance) =>
                          `${balance?.toFixed(displayDecimals, { groupSeparator: ',' })} ${balance.token.symbol}`
                      )
                      .join(', ')}
                  />
                  <TYPE.black fontWeight={800}>
                    {totalValueDeposited
                      ? `${!pegComesAfter ? peggedTo : ''}${formatNumber(
                          totalValueDeposited.toFixed(displayDecimals)
                        )} ${pegComesAfter ? peggedTo : ''}`
                      : '-'}
                  </TYPE.black>
                </RowFixed>
              </RowBetween>

              <RowBetween>
                <TYPE.darkGray>Total volume</TYPE.darkGray>
                <RowFixed>
                  <TYPE.black fontWeight={800}>
                    {totalVolume
                      ? `${!pegComesAfter ? peggedTo : ''}${totalVolume.toFixed(displayDecimals, {
                          groupSeparator: ',',
                        })} ${pegComesAfter ? peggedTo : ''}`
                      : '-'}
                  </TYPE.black>
                </RowFixed>
              </RowBetween>

              {openManage && (
                <>
                  {mobiRate && (
                    <RowBetween>
                      <TYPE.darkGray>MOBI rate</TYPE.darkGray>
                      <TYPE.black fontWeight={800}>
                        {totalMobiRate
                          ? totalMobiRate?.multiply(BIG_INT_SECONDS_IN_WEEK)?.toFixed(0, { groupSeparator: ',' }) ?? '-'
                          : '0'}
                        {' / week'}
                      </TYPE.black>
                    </RowBetween>
                  )}
                  {poolInfo.externalRewardRates &&
                    poolInfo.externalRewardRates.map((rate) => (
                      <RowBetween key={rate.toExact()}>
                        <TYPE.darkGray>{rate.token.symbol?.toUpperCase()} rate</TYPE.darkGray>
                        <TYPE.black
                          fontWeight={800}
                          marginLeft="auto"
                          key={`additional-reward-total-${rate.currency.symbol}-${poolInfo.name}`}
                        >
                          {rate
                            ? rate?.multiply(BIG_INT_SECONDS_IN_WEEK)?.toSignificant(4, { groupSeparator: ',' }) ?? '-'
                            : '0'}
                          {` / week`}
                        </TYPE.black>
                      </RowBetween>
                    ))}
                  {!!account && isStaking && (
                    <RowBetween>
                      <TYPE.darkGray fontWeight={500}>Your share</TYPE.darkGray>
                      <RowFixed>
                        {/* <QuestionHelper
                        text={userBalances
                          .map(
                            (balance) =>
                              // eslint-disable-next-line prettier/prettier
                              `${balance?.toFixed(displayDecimals + 1, { groupSeparator: ',' })} ${
                                balance.token.symbol
                              }`
                          )
                          .join(', ')}
                      /> */}
                        <TYPE.black fontWeight={800}>
                          {!pegComesAfter && peggedTo}
                          {valueOfDeposited.toFixed(displayDecimals + 1)}
                          {pegComesAfter && ` ${peggedTo}`}
                        </TYPE.black>
                      </RowFixed>
                    </RowBetween>
                  )}
                </>
              )}
            </StatContainer>
            {!openManage && (
              <StyledButton
                background={poolColor}
                backgroundHover={poolColor}
                onClick={() => (isStaking ? setOpenManage(true) : setOpenDeposit(true))}
                style={{ width: '10%', fontWeight: 700, fontSize: 18, maxWidth: '150px', marginTop: '-20px' }}
              >
                {isStaking ? 'MANAGE' : 'DEPOSIT'}
              </StyledButton>
            )}
          </ExpandedRow>
        </div>
      </InfoContainer>
      <Bottom>
        {!!account && !isStaking && openManage && (
          <StyledButton
            background={poolColor}
            backgroundHover={poolColor}
            onClick={() => setOpenDeposit(true)}
            style={{ fontWeight: 700, fontSize: 18 }}
          >
            DEPOSIT
          </StyledButton>
        )}
        {!!account && isStaking && openManage && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              transition: 'all 0.3s ease-in',
            }}
          >
            <DepositWithdrawBtn
              background={theme(false).celoGreen}
              backgroundHover={theme(false).celoGreen}
              onClick={() => setOpenDeposit(true)}
              style={{ width: '30%', fontWeight: 700, fontSize: 18 }}
            >
              DEPOSIT
            </DepositWithdrawBtn>
            <DepositWithdrawBtn
              background={theme(false).celoRed}
              backgroundHover={theme(false).celoRed}
              onClick={() => setOpenWithdraw(true)}
              style={{ width: '30%', fontWeight: 700, fontSize: 18 }}
            >
              WITHDRAW
            </DepositWithdrawBtn>
            {poolInfo.gaugeAddress !== undefined && (
              <StyledInternalLink to={`/farm/${poolInfo.name}`} style={{ width: '30%', textDecoration: 'none' }}>
                <DepositWithdrawBtn
                  background={theme(false).celoGold}
                  backgroundHover={theme(false).celoGold}
                  style={{ width: '100%', fontWeight: 700, fontSize: 18 }}
                >
                  FARM
                </DepositWithdrawBtn>
              </StyledInternalLink>
            )}
          </div>
        )}
      </Bottom>
    </Wrapper>
  )
}
