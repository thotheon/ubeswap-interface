import { AutoColumn } from 'components/Column'
import Loader from 'components/Loader'
import { RowFixed } from 'components/Row'
import { ChainLogo } from 'constants/StablePools'
import { usePoolColor } from 'hooks/useColor'
import React, { useState } from 'react'
import { GaugeSummary, useVotePowerLeft } from 'state/staking/hooks'
import styled from 'styled-components'
import { TYPE } from 'theme'

import CurrencyPoolLogo from '../../components/CurrencyPoolLogo'
import Logo from '../../components/Logo'
import { useStablePoolInfo } from '../../state/stablePools/hooks'
import GaugeVoteModal from './GaugeVoteModal'

const Wrapper = styled(AutoColumn)`
  border-radius: 12px;
  gap: 1rem;
  width: 100%;
  overflow: hidden;
  position: relative;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: ${({ theme }) => theme.text1} !important;
  ${({ theme }) => theme.mediaWidth.upToSmall`
`}
`

const CardContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 10px;
  row-gap: 15px;
  justify-self: center;
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

interface GaugeWeightsProps {
  summaries: GaugeSummary[]
}

export default function Vote({ summaries }: GaugeWeightsProps) {
  const [showUserVote, setShowUserVote] = useState(false)
  const votePowerLeft = useVotePowerLeft()

  return summaries.length === 0 ? (
    <Wrapper>
      <Loader />
    </Wrapper>
  ) : (
    <Wrapper>
      <TYPE.darkGray>Allocate your voting power to affect the MOBI distribution of each pool.</TYPE.darkGray>
      <TYPE.darkGray>{votePowerLeft}% Left to Allocate</TYPE.darkGray>
      <CardContainer>
        {summaries.map((summary) => (
          <WeightCard showUserVote={showUserVote} position={summary} key={`weight-card-${summary.pool}`} />
        ))}
      </CardContainer>
    </Wrapper>
  )
}

const PositionWrapper = styled(AutoColumn)`
  border-radius: 20px;
  width: 100%;
  overflow: hidden;
  position: relative;
  padding: 1rem;
  background: ${({ theme }) => theme.bg1};
  color: ${({ theme }) => theme.text1} !important;
  ${({ theme }) => theme.mediaWidth.upToSmall`
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  padding-top: 1rem;
  margin-top: 1rem;
  max-width: 240px;
`}
`

const StyledLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  background-color: ${({ theme }) => theme.white};
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

function WeightCard({ position }: { position: GaugeSummary }) {
  const [voteModalOpen, setVoteModalOpen] = useState(false)
  const stablePools = useStablePoolInfo()
  const poolInfo = stablePools.filter((x) => x.name === position.pool)[0]

  const poolColor = usePoolColor(poolInfo)

  return (
    <>
      <GaugeVoteModal summary={position} isOpen={voteModalOpen} onDismiss={() => setVoteModalOpen(false)} />

      <PositionWrapper onClick={() => setVoteModalOpen(true)}>
        <TopSection>
          <RowFixed style={{ gap: '10px' }}>
            <TYPE.black fontWeight={600} fontSize={[18, 24]}>
              {position.pool}
            </TYPE.black>
            <StyledLogo size={'32px'} srcs={[ChainLogo[poolInfo.displayChain]]} alt={'logo'} />
          </RowFixed>
          <RowFixed>
            <TYPE.subHeader
              style={{ paddingLeft: '.15rem' }}
              color={poolColor}
              className="apr"
              fontWeight={800}
              fontSize={[18, 24]}
            >
              {`Future: ${position.futureWeight.toFixed(2)}%`}
            </TYPE.subHeader>
          </RowFixed>
        </TopSection>
        <SecondSection>
          <RowFixed style={{ marginTop: 10 }}>
            <CurrencyPoolLogo tokens={poolInfo.tokens.slice()} size={24} margin={true} />
            <TYPE.darkGray fontWeight={450} fontSize={[14, 20]}>
              {poolInfo.tokens.map((t) => t.symbol).join(' / ')}
            </TYPE.darkGray>
          </RowFixed>
          <div>
            <TYPE.black fontSize={16} fontWeight={800} color={poolColor}>{`Current: ${position.currentWeight.toFixed(
              2
            )}%`}</TYPE.black>
            <TYPE.black fontSize={16} fontWeight={800} color={poolColor}>{`My Vote: ${position.powerAllocated.toFixed(
              2
            )}%`}</TYPE.black>
          </div>
        </SecondSection>
      </PositionWrapper>
    </>
  )
}