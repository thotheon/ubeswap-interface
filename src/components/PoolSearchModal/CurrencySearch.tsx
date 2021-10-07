import { Token } from '@ubeswap/sdk'
import { STATIC_POOL_INFO } from 'constants/StablePools'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import useToggle from 'hooks/useToggle'
import React, { useCallback, useRef } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import styled from 'styled-components'

import { useActiveContractKit } from '../../hooks'
import { CloseIcon, TYPE } from '../../theme'
import Column from '../Column'
import { RowBetween } from '../Row'
import { PaddedColumn, Separator } from '../SearchModal/styleds'
import CurrencyList from './CurrencyList'

const ContentWrapper = styled(Column)`
  width: 100%;
  flex: 1 1;
  position: relative;
`

interface CurrencySearchProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Token | null
  onCurrencySelect: (currency: Token) => void
}

export function CurrencySearch({ selectedCurrency, onCurrencySelect, onDismiss, isOpen }: CurrencySearchProps) {
  const { chainId } = useActiveContractKit()
  const theme = useTheme()

  // refs for fixed size lists
  const fixedList = useRef<FixedSizeList>()

  const tokensToSelect = STATIC_POOL_INFO[chainId].map((x) => x.lpToken)

  const showETH = false

  const handleCurrencySelect = useCallback(
    (currency: Token) => {
      onCurrencySelect(currency)
      onDismiss()
    },
    [onDismiss, onCurrencySelect]
  )

  // menu ui
  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, open ? toggle : undefined)

  return (
    <ContentWrapper>
      <PaddedColumn gap="16px">
        <RowBetween>
          <Text fontWeight={500} fontSize={16}>
            Select a pool
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
      </PaddedColumn>
      <Separator />
      {tokensToSelect.length > 0 ? (
        <div style={{ flex: '1' }}>
          <AutoSizer disableWidth>
            {({ height }) => (
              <CurrencyList
                height={height}
                showETH={showETH}
                currencies={tokensToSelect}
                onCurrencySelect={handleCurrencySelect}
                otherCurrency={null}
                selectedCurrency={selectedCurrency}
                fixedListRef={fixedList}
                showImportView={() => null}
                setImportToken={() => null}
              />
            )}
          </AutoSizer>
        </div>
      ) : (
        <Column style={{ padding: '20px', height: '100%' }}>
          <TYPE.main color={theme.text3} textAlign="center" mb="20px">
            No results found in active pools.
          </TYPE.main>
        </Column>
      )}
    </ContentWrapper>
  )
}
