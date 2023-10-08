import { useCallback, useEffect, useState } from 'react';

import { getMyReferrals } from 'network/referral';
import { Address } from 'wagmi';

export const useReferralCodes = (address: Address | undefined, chainId: number) => {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [traderRebatePercentage, setTraderRebatePercentage] = useState(0);

  const getReferralCodesAsync = useCallback(async () => {
    if (address) {
      const referralCodesResponse = await getMyReferrals(chainId, address);

      if (referralCodesResponse.data.length) {
        const { referral, PassOnPerc } = referralCodesResponse.data[0];
        setReferralCode(referral);
        setTraderRebatePercentage(PassOnPerc ?? 0);
      }
    }
  }, [address, chainId]);

  useEffect(() => {
    getReferralCodesAsync().then().catch(console.error);
  }, [getReferralCodesAsync]);

  return {
    referralCode,
    traderRebatePercentage,
    getReferralCodesAsync,
  };
};
