import { type ChangeEvent, useCallback, useState } from 'react';

import { getCodeRebate } from 'network/referral';
import { isEnabledChain } from 'utils/isEnabledChain';

import { CodeStateE } from './enums';

export const useCodeInput = (chainId: number | undefined) => {
  const [codeInputValue, setCodeInputValue] = useState('');
  const [codeState, setCodeState] = useState(CodeStateE.DEFAULT);

  const handleCodeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!chainId || !isEnabledChain(chainId)) {
        return;
      }

      const { value } = event.target;

      // clean up string and transform to uppercase
      const filteredValue = value.replace(/[^a-zA-Z0-9\-_]/g, '').toUpperCase();

      setCodeInputValue(filteredValue);
      setCodeState(CodeStateE.DEFAULT);

      if (filteredValue === '') {
        return;
      }

      // TODO: VOV: Need to use debounce
      getCodeRebate(chainId, filteredValue)
        .then(() => setCodeState(CodeStateE.CODE_TAKEN))
        .catch(() => setCodeState(CodeStateE.CODE_AVAILABLE));
    },
    [chainId]
  );

  return { codeInputValue, setCodeInputValue, handleCodeChange, codeState };
};
