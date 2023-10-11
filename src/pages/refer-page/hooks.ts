import { type ChangeEvent, useCallback, useState } from 'react';

import { getCodeRebate } from 'network/referral';
import { debounceLeading } from 'utils/debounceLeading';

import { CodeStateE } from './enums';

const DEBOUNCE_TIMEOUT = 1000;

const debounceCodeCheck = debounceLeading((callback: () => void) => {
  callback();
}, DEBOUNCE_TIMEOUT);

export const useCodeInput = (chainId: number) => {
  const [codeInputValue, setCodeInputValue] = useState('');
  const [codeState, setCodeState] = useState(CodeStateE.DEFAULT);

  const checkCodeExists = useCallback(
    (code: string) => {
      debounceCodeCheck(() => {
        getCodeRebate(chainId, code)
          .then(() => setCodeState(CodeStateE.CODE_TAKEN))
          .catch(() => setCodeState(CodeStateE.CODE_AVAILABLE));
      });
    },
    [chainId]
  );

  const handleCodeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;

      // clean up string and transform to uppercase
      const filteredValue = value.replace(/[^a-zA-Z0-9\-_]/g, '').toUpperCase();

      setCodeInputValue(filteredValue);
      setCodeState(CodeStateE.DEFAULT);

      if (filteredValue === '') {
        return;
      }

      checkCodeExists(filteredValue);
    },
    [checkCodeExists]
  );

  return { codeInputValue, handleCodeChange, codeState };
};
