import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';

import { getOpenRewards } from 'network/referral';
import type { OpenTraderRebateI } from 'types/types';
import { isEnabledChain } from 'utils/isEnabledChain';

export const useFetchOpenRewards = () => {
  const { address, chainId } = useAccount();

  const [openRewards, setOpenRewards] = useState<OpenTraderRebateI[]>([]);

  const openRewardsRequestRef = useRef(false);

  useEffect(() => {
    if (!address || !chainId || !isEnabledChain(chainId)) {
      setOpenRewards([]);
      return;
    }

    if (openRewardsRequestRef.current) {
      return;
    }

    openRewardsRequestRef.current = true;

    getOpenRewards(chainId, address)
      .then(({ data }) => {
        setOpenRewards(data.openEarnings ?? []);
      })
      .catch(console.error)
      .finally(() => {
        openRewardsRequestRef.current = false;
      });
  }, [address, chainId]);

  return { openRewards };
};
