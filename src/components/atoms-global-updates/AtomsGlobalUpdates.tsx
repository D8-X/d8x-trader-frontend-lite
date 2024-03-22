import { useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';

import { activatedOneClickTradingAtom } from 'store/app.store';
import { storageKeyAtom } from 'store/order-block.store';

export const AtomsGlobalUpdates = () => {
  const { isDisconnected } = useAccount();

  const setActivatedOneClickTrading = useSetAtom(activatedOneClickTradingAtom);
  const setStorageKey = useSetAtom(storageKeyAtom);

  useEffect(() => {
    if (isDisconnected) {
      setActivatedOneClickTrading(false);
      setStorageKey(null);
    }
  }, [isDisconnected, setActivatedOneClickTrading, setStorageKey]);

  return null;
};
