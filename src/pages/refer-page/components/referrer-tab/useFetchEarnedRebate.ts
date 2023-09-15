import { useEffect, useRef, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';

import { getEarnedRebate } from 'network/referral';
import { RebateTypeE } from 'types/enums';
import type { EarnedRebateI } from 'types/types';

export const useFetchEarnedRebate = (rebateType: RebateTypeE) => {
  const chainId = useChainId();
  const { address } = useAccount();

  const [earnedRebates, setEarnedRebates] = useState<EarnedRebateI[]>([]);

  const earnedRebateRequestRef = useRef(false);

  useEffect(() => {
    if (address && chainId) {
      if (earnedRebateRequestRef.current) {
        return;
      }

      earnedRebateRequestRef.current = true;

      getEarnedRebate(chainId, address, rebateType)
        .then(({ data }) => {
          setEarnedRebates(data);
        })
        .catch(console.error)
        .finally(() => {
          earnedRebateRequestRef.current = false;
        });
    } else {
      setEarnedRebates([]);
    }
  }, [address, chainId, rebateType]);

  return { earnedRebates };
};
