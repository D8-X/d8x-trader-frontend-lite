import { useEffect, useRef, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';

import { getOpenRewards } from 'network/referral';
import type { OpenTraderRebateI } from 'types/types';

export const useFetchOpenRewards = () => {
  const chainId = useChainId();
  const { address } = useAccount();

  const [openRewards, setOpenRewards] = useState<OpenTraderRebateI[]>([]);

  const openRewardsRequestRef = useRef(false);

  useEffect(() => {
    if (address && chainId) {
      if (openRewardsRequestRef.current) {
        return;
      }

      openRewardsRequestRef.current = true;

      getOpenRewards(chainId, address)
        .then(({ data }) => {
          setOpenRewards(data.openEarnings);
        })
        .catch(console.error)
        .finally(() => {
          openRewardsRequestRef.current = false;
        });
    } else {
      setOpenRewards([]);
    }
  }, [address, chainId]);

  return { openRewards };
};
