import { useCallback, useEffect, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useAtom } from 'jotai';

import { Box } from '@mui/material';

import { selectedPoolAtom } from 'store/pools.store';

import { Overview, type OverviewItemI } from '../overview/Overview';
import { Disclaimer } from '../disclaimer/Disclaimer';
import { ReferralCodeBlock } from '../referral-code-block/ReferralCodeBlock';

import { getEarnedRebate, getOpenTraderRebate, getReferralCodes } from 'network/referral';

import { type EarnedRebateI, type OpenTraderRebateI } from 'types/types';
import { RebateTypeE } from 'types/enums';

import styles from './TraderTab.module.scss';

const disclaimerTextBlocks = [
  'Enter a referral code to receive discounts on trading fees.',
  'The discounts are airdropped weekly to your wallet.',
];

export const TraderTab = () => {
  const [earnedRebates, setEarnedRebates] = useState(0);
  const [openRewards, setOpenRewards] = useState(0);

  const [referralCode, setReferralCode] = useState('');
  const [traderRebatePercentage, setTraderRebatePercentage] = useState(0);

  const [selectedPool] = useAtom(selectedPoolAtom);

  const { address } = useAccount();
  const chainId = useChainId();

  const digestResponseData = useCallback((data: EarnedRebateI[] | OpenTraderRebateI[], type: 'rebates' | 'rewards') => {
    const setState = type === 'rebates' ? setEarnedRebates : setOpenRewards;
    const responseLength = data.length;
    if (!responseLength) {
      setState(0);
      return;
    }
    if (responseLength === 1) {
      setState(data[0].amountCC);
      return;
    }
    const cumulatedValue = data.filter((item) => item.poolId === 1).reduce((acc, currVal) => acc + currVal.amountCC, 0);
    setState(cumulatedValue);
  }, []);

  const getEarnedRebatesAsync = useCallback(async () => {
    if (address) {
      const earnedRebatesResponse = await getEarnedRebate(chainId, address, RebateTypeE.Trader);
      digestResponseData(earnedRebatesResponse.data, 'rebates');
    }
  }, [address, chainId, digestResponseData]);

  useEffect(() => {
    getEarnedRebatesAsync().then().catch(console.error);
  }, [getEarnedRebatesAsync]);

  const getOpenRewardsAsync = useCallback(async () => {
    if (address) {
      try {
        const openRewardsResponse = await getOpenTraderRebate(chainId, address);
        digestResponseData(openRewardsResponse.data, 'rewards');
      } catch (err) {
        console.error(err);
      }
    }
  }, [address, chainId, digestResponseData]);

  useEffect(() => {
    getOpenRewardsAsync().then();
  }, [getOpenRewardsAsync]);

  const getReferralCodesAsync = useCallback(async () => {
    if (address) {
      const referralCodesResponse = await getReferralCodes(chainId, address);
      const traderReferralDataExists = !!Object.keys(referralCodesResponse.data.trader).length;

      if (traderReferralDataExists) {
        const { code, traderRebatePercFinal } = referralCodesResponse.data.trader;
        setReferralCode(code);
        setTraderRebatePercentage(traderRebatePercFinal ?? 0);
      }
    }
  }, [address, chainId]);

  useEffect(() => {
    getReferralCodesAsync().then().catch(console.error);
  }, [getReferralCodesAsync]);

  const overviewItems: OverviewItemI[] = [
    {
      title: 'Total earned rebates',
      value: address ? earnedRebates : '--',
      poolSymbol: selectedPool?.poolSymbol ?? '--',
    },
    { title: 'Open rewards', value: address ? openRewards : '--', poolSymbol: selectedPool?.poolSymbol ?? '--' },
  ];

  return (
    <Box className={styles.root}>
      <Overview title="Your discounts" items={overviewItems} />
      <Disclaimer title="Trade & Earn" textBlocks={disclaimerTextBlocks} />
      <div className={styles.divider} />
      <ReferralCodeBlock
        referralCode={referralCode}
        traderRebatePercentage={traderRebatePercentage}
        onCodeApplySuccess={getReferralCodesAsync}
      />
    </Box>
  );
};
