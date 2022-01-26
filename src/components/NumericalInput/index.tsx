import React from 'react'
import styled from 'styled-components'

import { escapeRegExp } from '../../utils'

const StyledInput = styled.input<{
  error?: boolean
  white?: boolean
  fontSize?: string
  align?: string
  disabled?: boolean
}>`
  color: ${({ error, theme }) => (error ? theme.red1 : theme.text1)};
  width: 0;
  position: relative;
  text-overflow: ellipsis;
  text-align: right;
  font-weight: 500;
  outline: none;
  border: none;
  flex: 1 1 auto;
  background-color: rgba(0, 0, 0, 0);
  font-size: ${({ fontSize }) => fontSize ?? '24px'};
  text-align: ${({ align }) => align && align};
  cursor: ${({ disabled }) => disabled && 'not-allowed'};
  white-space: nowrap;
  overflow: hidden;
  padding: 0px;
  -webkit-appearance: textfield;

  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }

  [type='number'] {
    -moz-appearance: textfield;
  }

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  ::placeholder {
    color: ${({ theme }) => theme.text4};
  }
`

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group

export const Input = React.memo(function InnerInput({
  value,
  onUserInput,
  placeholder,
  disabled,
  ...rest
}: {
  value: string | number
  onUserInput: (input: string) => void
  error?: boolean
  fontSize?: string
  disabled?: boolean
  align?: 'right' | 'left'
} & Omit<React.HTMLProps<HTMLInputElement>, 'ref' | 'onChange' | 'as'>) {
  const enforcer = (nextUserInput: string) => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      onUserInput(nextUserInput)
    }
  }

  return (
    <StyledInput
      {...rest}
      value={value}
      onChange={(event) => {
        // replace commas with periods, because uniswap exclusively uses period as the decimal separator
        enforcer(event.target.value.replace(/,/g, '.'))
      }}
      // universal input options
      inputMode="decimal"
      title="Token Amount"
      autoComplete="off"
      autoCorrect="off"
      disabled={disabled}
      // text-specific options
      type="text"
      pattern="^[0-9]*[.,]?[0-9]*$"
      placeholder={placeholder || '0.0'}
      minLength={1}
      maxLength={79}
      spellCheck="false"
    />
  )
})

export default Input

// const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group
