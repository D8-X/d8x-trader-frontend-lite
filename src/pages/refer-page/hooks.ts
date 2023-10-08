import { type ChangeEvent, useCallback, useRef, useState } from 'react';

import { checkCodeExists } from './helpers';

/**
 * @member DEFAULT
 * @member CODE_TAKEN signifies that the code does already exist - can be redeemed
 * @member CODE_AVAILABLE signifies that the code does not exist - cannot be redeemed
 */
export enum CodeStateE {
  DEFAULT,
  CODE_TAKEN,
  CODE_AVAILABLE,
}

export const useCodeInput = (chainId: number) => {
  const [codeInputValue, setCodeInputValue] = useState('');
  const [codeState, setCodeState] = useState(CodeStateE.DEFAULT);

  const checkedCodesRef = useRef<Record<string, boolean>>({});

  const handleCodeChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;

      // clean up string and transform to uppercase
      const filteredValue = value.replace(/[^a-zA-Z0-9\-_]/g, '').toUpperCase();

      setCodeInputValue(filteredValue);

      // if user resets input reset code state to default
      if (filteredValue === '') {
        setCodeState(CodeStateE.DEFAULT);
        return;
      }

      // if input is filled
      // only check code on every keystroke if code has not been checked before (ref)
      if (!(filteredValue in checkedCodesRef.current)) {
        checkedCodesRef.current[filteredValue] = await checkCodeExists(chainId, filteredValue);
      }

      if (!checkedCodesRef.current[filteredValue]) {
        setCodeState(CodeStateE.CODE_AVAILABLE);
        return;
      }

      setCodeState(CodeStateE.CODE_TAKEN);
    },
    [chainId]
  );

  return { codeInputValue, handleCodeChange, codeState };
};
