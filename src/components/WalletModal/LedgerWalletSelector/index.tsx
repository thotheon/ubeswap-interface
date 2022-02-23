import Loader from 'components/Loader'
import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'

import { NETWORK_CHAIN_ID } from '../../../connectors'
import { LedgerKit } from '../../../connectors/ledger/LedgerConnector'
import { LedgerAddress } from './LedgerAddress'

interface Props {
  handleSelectIndex: (index: number) => any
}

const ADDRESSES_PER_PAGE = 5

type LedgerConnectorModalProps = {
  handleSelectIndex: (i: number) => any
  onClose: () => any
}

export default function LedgerConnectorModal({ handleSelectIndex }: LedgerConnectorModalProps) {
  return <LedgerWalletSelector handleSelectIndex={handleSelectIndex} />
}

export const LedgerWalletSelector: React.FC<Props> = ({ handleSelectIndex }: Props) => {
  const [addresses, setAddresses] = useState<readonly string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(0)
  const connectToLedger = useCallback(async () => {
    setError(null)
    const idxs = Array(ADDRESSES_PER_PAGE)
      .fill(null)
      .map((_, i) => page * ADDRESSES_PER_PAGE + i)
    try {
      const ledgerKit = await LedgerKit.init(NETWORK_CHAIN_ID, idxs)
      setAddresses(ledgerKit.wallet.getAccounts())
    } catch (e) {
      setError(e.message)
    }
  }, [page])

  useEffect(() => {
    ;(async () => {
      await connectToLedger()
    })()
  }, [connectToLedger])
  return (
    <LedgerCard>
      <Heading>Connect to Ledger</Heading>
      {error ? (
        <ErrorGroup>
          <p>{error}</p>
          {error.includes('Unable to claim interface.') && <p>Try restarting your Ledger.</p>}
          <ErrorButton
            onClick={() => {
              void connectToLedger()
            }}
          >
            Try Again
          </ErrorButton>
        </ErrorGroup>
      ) : (
        <>
          <p style={{ color: 'grey' }}>Please select a wallet below.</p>
          {addresses === null ? (
            <InfoCard>
              <span>
                Loading wallets... <Loader />
              </span>
            </InfoCard>
          ) : (
            <OptionsGrid>
              {addresses.map((address, i) => (
                <LedgerAddress key={address} address={address} tryActivation={() => handleSelectIndex(i)} />
              ))}
              <InfoCard
                onClick={() => {
                  setAddresses(null)
                  setPage(page + 1)
                }}
              >
                Load more
              </InfoCard>
            </OptionsGrid>
          )}
        </>
      )}
    </LedgerCard>
  )
}

const LedgerCard = styled.div`
  padding: 2rem;
`

const OptionsGrid = styled.div`
  color: black;
  display: grid;
  grid-row-gap: 10px;
`

const Heading = styled.h3`
  color: black;
  margin-top: 0;
`

export const InfoCard = styled.button`
  padding: 1rem;
  outline: none;
  border: 1px solid;
  border-radius: 12px;
  width: 100% !important;
  color: black;
  &:focus {
    box-shadow: 0 0 0 1px grey;
  }
  border-color: grey;

  margin-top: 0;
  &:hover {
    cursor: pointer;
    border: 1px solid grey;
  }
  opacity: ${({ disabled }) => (disabled ? '0.5' : '1')};

  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const ErrorGroup = styled.div`
  color: black;
  align-items: center;
  justify-content: flex-start;
`

const ErrorButton = styled.div`
  border-radius: 8px;
  font-size: 12px;
  margin-left: 1rem;
  padding: 0.5rem;
  font-weight: 600;
  user-select: none;

  &:hover {
    cursor: pointer;
  }
`
