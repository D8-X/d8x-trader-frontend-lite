import { useConnectModal } from '@rainbow-me/rainbowkit';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@mui/material';

import styles from './WalletConnectButton.module.scss';

interface WalletConnectButtonPropsI {
  label?: ReactNode;
  className?: string;
  disabled?: boolean;
}

export const WalletConnectButton = (props: WalletConnectButtonPropsI) => {
  const { t } = useTranslation();

  const {
    label = <span className={styles.connectLabel}>{t('common.wallet-connect')}</span>,
    className,
    disabled,
  } = props;

  const { openConnectModal } = useConnectModal();

  return (
    <Button onClick={openConnectModal} variant="primary" className={className} disabled={disabled}>
      {label}
    </Button>
  );
};
