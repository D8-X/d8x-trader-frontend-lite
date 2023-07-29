import { useAtom } from 'jotai';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';

import { Box } from '@mui/material';

import { getEarnedRebate, getReferralVolume } from 'network/referral';
import { selectedPoolAtom, selectedPoolIdAtom } from 'store/pools.store';
import { RebateTypeE } from 'types/enums';
import type { EarnedRebateI, ReferralVolumeI } from 'types/types';

import { Overview, type OverviewItemI } from '../overview/Overview';
import { Disclaimer } from '../disclaimer/Disclaimer';
import { ReferralsBlock } from '../referrals-block/ReferralsBlock';

import styles from './ReferrerTab.module.scss';

const disclaimerTextBlocks = [
  'Earn rebates by inviting traders to trade on D8X. Rebates are airdropped to your wallet weekly.',
  'Check out details on the D8X referral program.',
];

export const ReferrerTab = memo(() => {
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [selectedPoolId] = useAtom(selectedPoolIdAtom);

  const chainId = useChainId();
  const { address } = useAccount();

  const [referralVolumes, setReferralVolumes] = useState<ReferralVolumeI[]>([]);
  const [earnedRebates, setEarnedRebates] = useState<EarnedRebateI[]>([]);

  const referralVolumeRequestRef = useRef(false);
  const earnedRebateRequestRef = useRef(false);

  useEffect(() => {
    if (address && chainId) {
      if (referralVolumeRequestRef.current) {
        return;
      }

      referralVolumeRequestRef.current = true;

      getReferralVolume(chainId, address)
        .then(({ data }) => {
          setReferralVolumes(data);
        })
        .catch(console.error)
        .finally(() => {
          referralVolumeRequestRef.current = false;
        });
    } else {
      setReferralVolumes([]);
    }
  }, [address, chainId]);

  useEffect(() => {
    if (address && chainId) {
      if (earnedRebateRequestRef.current) {
        return;
      }

      earnedRebateRequestRef.current = true;

      getEarnedRebate(chainId, address, RebateTypeE.Referrer)
        .then(({ data }) => {
          setEarnedRebates(data);
        })
        .catch(console.error)
        .finally(() => {
          earnedRebateRequestRef.current = false;
        });
    } else {
      setReferralVolumes([]);
    }
  }, [address, chainId]);

  const overviewItems: OverviewItemI[] = useMemo(() => {
    const referralVolumesAmount = referralVolumes
      .filter((volume) => volume.poolId === selectedPoolId)
      .reduce((accumulator, currentValue) => accumulator + currentValue.quantityCC, 0);

    const earnedRebatesAmount = earnedRebates
      .filter((rebate) => rebate.poolId === selectedPoolId)
      .reduce((accumulator, currentValue) => accumulator + currentValue.amountCC, 0);

    return [
      {
        title: 'Total referred trading volume',
        value: address ? referralVolumesAmount : '--',
        poolSymbol: selectedPool?.poolSymbol ?? '--',
      },
      {
        title: 'Total earned rebates',
        value: address ? earnedRebatesAmount : '--',
        poolSymbol: selectedPool?.poolSymbol ?? '--',
      },
    ];
  }, [referralVolumes, earnedRebates, selectedPool?.poolSymbol, selectedPoolId, address]);

  return (
    <Box className={styles.root}>
      <Overview title="Your referrals" items={overviewItems} />
      <Disclaimer title="Refer & Earn" textBlocks={disclaimerTextBlocks} />
      <div className={styles.divider} />
      <ReferralsBlock />
    </Box>
  );
});
