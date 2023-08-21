import { useAtom } from 'jotai';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useChainId } from 'wagmi';

import { Box } from '@mui/material';

import { getEarnedRebate, getReferralVolume } from 'network/referral';
import { poolsAtom } from 'store/pools.store';
import { RebateTypeE } from 'types/enums';
import type { EarnedRebateI, OverviewItemI, OverviewPoolItemI, ReferralVolumeI } from 'types/types';

import { Overview } from '../overview/Overview';
import { Disclaimer } from '../disclaimer/Disclaimer';
import { ReferralsBlock } from '../referrals-block/ReferralsBlock';

import styles from './ReferrerTab.module.scss';

export const ReferrerTab = memo(() => {
  const { t } = useTranslation();

  const [pools] = useAtom(poolsAtom);

  const chainId = useChainId();
  const { address } = useAccount();

  const [referralVolumes, setReferralVolumes] = useState<ReferralVolumeI[]>([]);
  const [earnedRebates, setEarnedRebates] = useState<EarnedRebateI[]>([]);

  const referralVolumeRequestRef = useRef(false);
  const earnedRebateRequestRef = useRef(false);

  const disclaimerTextBlocks = useMemo(
    () => [t('pages.refer.referrer-tab.disclaimer-text-block1'), t('pages.refer.referrer-tab.disclaimer-text-block2')],
    [t]
  );

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
    const referralVolumesByPools: OverviewPoolItemI[] = [];
    const earnedRebatesByPools: OverviewPoolItemI[] = [];

    pools.forEach((pool) => {
      const referralVolumesAmount = referralVolumes
        .filter((volume) => volume.poolId === pool.poolId)
        .reduce((accumulator, currentValue) => accumulator + currentValue.quantityCC, 0);

      const earnedRebatesAmount = earnedRebates
        .filter((rebate) => rebate.poolId === pool.poolId)
        .reduce((accumulator, currentValue) => accumulator + currentValue.amountCC, 0);

      referralVolumesByPools.push({ poolSymbol: pool.poolSymbol, value: referralVolumesAmount });
      earnedRebatesByPools.push({ poolSymbol: pool.poolSymbol, value: earnedRebatesAmount });
    });

    return [
      {
        title: t('pages.refer.referrer-tab.volume'),
        poolsItems: address ? referralVolumesByPools : [],
      },
      {
        title: t('pages.refer.referrer-tab.rebates'),
        poolsItems: address ? earnedRebatesByPools : [],
      },
    ];
  }, [pools, referralVolumes, earnedRebates, address, t]);

  return (
    <Box className={styles.root}>
      <Overview title={t('pages.refer.referrer-tab.title1')} items={overviewItems} />
      <Disclaimer title={t('pages.refer.referrer-tab.title2')} textBlocks={disclaimerTextBlocks} />
      <div className={styles.divider} />
      <ReferralsBlock />
    </Box>
  );
});
