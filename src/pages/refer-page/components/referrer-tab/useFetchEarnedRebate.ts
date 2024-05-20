import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';

import { getEarnedRebate } from 'network/referral';
import type { EarnedRebateI } from 'types/types';
import { isEnabledChain } from 'utils/isEnabledChain';

export const useFetchEarnedRebate = () => {
  const { address, chainId } = useAccount();

  const [earnedRebates, setEarnedRebates] = useState<EarnedRebateI[]>([]);

  const earnedRebateRequestRef = useRef(false);

  useEffect(() => {
    if (address && isEnabledChain(chainId)) {
      if (earnedRebateRequestRef.current) {
        return;
      }

      earnedRebateRequestRef.current = true;

      getEarnedRebate(chainId, address)
        .then(({ data }) => {
          setEarnedRebates(data ?? []);
        })
        .catch(console.error)
        .finally(() => {
          earnedRebateRequestRef.current = false;
        });
    } else {
      setEarnedRebates([]);
    }
  }, [address, chainId]);

  return { earnedRebates };
};
