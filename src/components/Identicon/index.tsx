import Jazzicon from 'jazzicon'
import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'

import { useWeb3Context } from '../../hooks'

const StyledIdenticonContainer = styled.div`
  height: 1rem;
  width: 1rem;
  border-radius: 1.125rem;
  background-color: ${({ theme }) => theme.bg4};
`

export default function Identicon() {
  const ref = useRef<HTMLDivElement>()

  const { address, connected } = useWeb3Context()

  useEffect(() => {
    if (connected && ref.current) {
      ref.current.innerHTML = ''
      ref.current.appendChild(Jazzicon(16, parseInt(address.slice(2, 10), 16)))
    }
  }, [address, connected])

  // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451
  return <StyledIdenticonContainer ref={ref as any} />
}
