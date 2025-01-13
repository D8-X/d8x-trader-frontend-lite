import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { createWalletClient, http, type Address } from 'viem';
import { useAccount, useWalletClient } from 'wagmi';

import { Button, Typography } from '@mui/material';

import { activeStrategyWalletAtom, strategyAddressesAtom } from 'store/strategies.store';

import styles from './ConnectBlock.module.scss';
import { generateStrategyAccount } from 'blockchain-api/generateStrategyAccount';

export const ConnectBlock = () => {
  const { t } = useTranslation();

  const setActiveStrategyWallet = useSetAtom(activeStrategyWalletAtom);
  const setStrategyAddress = useSetAtom(strategyAddressesAtom);

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const handleConnect = useCallback(() => {
    if (walletClient && address) {
      generateStrategyAccount(walletClient).then((account) => {
        setActiveStrategyWallet(
          createWalletClient({
            account,
            chain: walletClient.chain,
            transport: http(),
          })
        );
        const addr = account.address;
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
  }, [walletClient, address, setActiveStrategyWallet, setStrategyAddress]);

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
