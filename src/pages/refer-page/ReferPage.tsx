import { useAtom } from 'jotai';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';

import { Box } from '@mui/material';

import { CollateralsSelect } from 'components/header/elements/collaterals-select/CollateralsSelect';
import { Header } from 'components/header/Header';
import { Container } from 'components/container/Container';
import { Footer } from 'components/footer/Footer';
import { getIsAgency, getReferralCodes } from 'network/referral';
import { isAgencyAtom, referralCodeAtom, referralCodesRefetchHandlerRefAtom } from 'store/refer.store';

import { TabSelector } from './components/tab-selector/TabSelector';
import { ReferrerTab } from './components/referrer-tab/ReferrerTab';
import { TraderTab } from './components/trader-tab/TraderTab';

import styles from './ReferPage.module.scss';

const tabComponents = [<ReferrerTab key="referrerTab" />, <TraderTab key="traderTab" />];

export const ReferPage = memo(() => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [, setIsAgency] = useAtom(isAgencyAtom);
  const [, setReferralCode] = useAtom(referralCodeAtom);

  const [, setReferralCodesRefetchHandler] = useAtom(referralCodesRefetchHandlerRefAtom);

  const chainId = useChainId();
  const { address } = useAccount();

  const referralCodesRequestRef = useRef(false);
  const isAgencyRequestRef = useRef(false);

  const handleTabChange = (newIndex: number) => setActiveTabIndex(newIndex);

  const refreshReferralCodes = useCallback(() => {
    if (referralCodesRequestRef.current || !chainId || !address) {
      return;
    }

    referralCodesRequestRef.current = true;

    getReferralCodes(chainId, address)
      .then(({ data }) => {
        setReferralCode(data);
      })
      .catch(console.error)
      .finally(() => {
        referralCodesRequestRef.current = false;
      });
  }, [address, chainId, setReferralCode]);

  useEffect(() => {
    setReferralCodesRefetchHandler({ handleRefresh: refreshReferralCodes });
  }, [refreshReferralCodes, setReferralCodesRefetchHandler]);

  useEffect(() => {
    refreshReferralCodes();
  }, [refreshReferralCodes]);

  useEffect(() => {
    if (isAgencyRequestRef.current || !chainId || !address) {
      return;
    }

    isAgencyRequestRef.current = false;

    getIsAgency(chainId, address)
      .then(({ data }) => {
        setIsAgency(data.isAgency);
      })
      .catch(console.error)
      .finally(() => {
        isAgencyRequestRef.current = false;
      });
  }, [chainId, address, setIsAgency]);

  return (
    <Box className={styles.root}>
      <Header>
        <CollateralsSelect />
      </Header>
      <Container className={styles.container}>
        <TabSelector activeTab={activeTabIndex} onTabChange={handleTabChange} />
        {tabComponents[activeTabIndex]}
      </Container>
      <Footer />
    </Box>
  );
});
