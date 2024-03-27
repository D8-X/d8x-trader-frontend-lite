import classnames from 'classnames';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { Button } from '@mui/material';

import { useWeb3Auth } from 'context/web3-auth-context/Web3AuthContext';

import styles from './Web3AuthConnectButton.module.scss';

interface Web3AuthConnectButtonPropsI {
  buttonClassName?: string;
}

export const Web3AuthDisconnectButton = memo(({ buttonClassName }: Web3AuthConnectButtonPropsI) => {
  const { t } = useTranslation();

  const { isConnected } = useAccount();

  const { disconnect } = useWeb3Auth();

  if (!isConnected) {
    return null;
  }

  return (
    <Button className={classnames(styles.connectWalletButton, buttonClassName)} onClick={disconnect} variant="primary">
      {t('common.connect-modal.disconnect')}
    </Button>
  );
});
