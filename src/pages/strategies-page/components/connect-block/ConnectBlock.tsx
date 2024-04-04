import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { type Address } from 'viem';
import { useAccount, useWalletClient } from 'wagmi';

import { Button, Typography } from '@mui/material';

import { strategyAddressesAtom } from 'store/strategies.store';
import { getStrategyAddress } from 'blockchain-api/getStrategyAddress';

import styles from './ConnectBlock.module.scss';

export const ConnectBlock = () => {
  const { t } = useTranslation();

  const setStrategyAddress = useSetAtom(strategyAddressesAtom);

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const handleConnect = useCallback(() => {
    if (walletClient && address) {
      getStrategyAddress(walletClient).then((addr) => {
        setStrategyAddress((prev) => {
          const newAddresses = [...prev];
          const userAddressLower = address.toLowerCase();
          const foundAddress = newAddresses.find(({ userAddress }) => userAddress === userAddressLower);
          if (foundAddress) {
            foundAddress.strategyAddress = addr;
          } else {
            newAddresses.push({
              userAddress: userAddressLower as Address,
              strategyAddress: addr,
            });
          }
          return newAddresses;
        });
      });
    }
  }, [walletClient, address, setStrategyAddress]);

  return (
    <div className={styles.root}>
      <Typography variant="h6" className={styles.title}>
        {t('pages.strategies.connect.title')}
      </Typography>
      <Button onClick={handleConnect} className={styles.connectButton} variant="primary">
        <span className={styles.modalButtonText}>{t('pages.strategies.connect.connect-button')}</span>
      </Button>
    </div>
  );
};
