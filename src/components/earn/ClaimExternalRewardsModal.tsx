import { TransactionResponse } from '@ethersproject/providers'
import { TokenAmount } from '@ubeswap/sdk'
import { useMobi } from 'hooks/Tokens'
import React, { useEffect, useState } from 'react'
import { useBlockNumber } from 'state/application/hooks'
import { StablePoolInfo, useExternalRewards } from 'state/stablePools/hooks'
import styled from 'styled-components'

import { useActiveContractKit } from '../../hooks'
import { useLiquidityGaugeContract, useMobiMinterContract } from '../../hooks/useContract'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { CloseIcon, TYPE } from '../../theme'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
import { LoadingView, SubmittedView } from '../ModalViews'
import { RowBetween } from '../Row'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`

interface StakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  stakingInfo: StablePoolInfo
}

export default function ExternalRewardsModal({ isOpen, onDismiss, stakingInfo }: StakingModalProps) {
  const { account, chainId } = useActiveContractKit()
  const mobi = useMobi()
  const externalRewards = useExternalRewards({ poolName: stakingInfo.name })
  // monitor call to help UI loading state
  const addTransaction = useTransactionAdder()
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  function wrappedOnDismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  const stakingContract = useLiquidityGaugeContract(stakingInfo.gaugeAddress)
  const minter = useMobiMinterContract()

  const [pendingMobi, setEarnedMobi] = useState<TokenAmount>()

  const blockNumber = useBlockNumber()

  useEffect(() => {
    const updateMobi = async () => {
      const bigInt = await stakingContract?.claimable_tokens(account)
      setEarnedMobi(new TokenAmount(mobi, bigInt.toString()))
    }
    account && updateMobi()
  }, [stakingContract, setEarnedMobi, account])

  async function onClaimReward() {
    if (stakingContract && stakingInfo?.stakedAmount) {
      setAttempting(true)
      await stakingContract['claim_rewards(address)'](account, { gasLimit: 1000000 })
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            summary: `Claim accumulated rewards`,
          })
          setHash(response.hash)
        })
        .catch((error: any) => {
          setAttempting(false)
          console.log(error)
        })
    }
  }

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }
  if (!stakingInfo?.stakedAmount) {
    error = error ?? 'Enter an amount'
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <TYPE.mediumHeader>Claim</TYPE.mediumHeader>
            <CloseIcon onClick={wrappedOnDismiss} />
          </RowBetween>
          {pendingMobi && (
            <AutoColumn justify="center" gap="md">
              {externalRewards &&
                externalRewards.map((reward) => (
                  <TYPE.body
                    fontWeight={600}
                    fontSize={36}
                    key={`claim-reward-${stakingInfo.name}-${reward.token.symbol}`}
                  >
                    {reward.toSignificant(6)} {reward.token.symbol}
                  </TYPE.body>
                ))}
              {/* {stakingInfo?.dualRewards && (
                <TYPE.body fontWeight={600} fontSize={36}>
                  {stakingInfo?.earnedAmount?.toSignificant(6)} {stakingInfo?.rewardToken?.symbol}
                </TYPE.body>
              )} */}
              <TYPE.body>Unclaimed rewards</TYPE.body>
            </AutoColumn>
          )}
          <TYPE.subHeader style={{ textAlign: 'center' }}>
            When you claim without withdrawing your liquidity remains in the mining pool.
          </TYPE.subHeader>
          <ButtonError disabled={!!error} error={!!error && !!stakingInfo?.stakedAmount} onClick={onClaimReward}>
            {error ?? 'Claim'}
          </ButtonError>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.body fontSize={20}>Claiming Rewards</TYPE.body>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Transaction Submitted</TYPE.largeHeader>
            <TYPE.body fontSize={20}>Claimed Rewards!</TYPE.body>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
