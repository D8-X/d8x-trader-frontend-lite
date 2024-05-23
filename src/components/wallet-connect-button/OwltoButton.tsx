import { useTranslation } from 'react-i18next';

import { CurrencyExchangeOutlined } from '@mui/icons-material';
import { Button, Link } from '@mui/material';

import styles from './WalletConnectButton.module.scss';

export const OwltoButton = () => {
  const { t } = useTranslation();

  return (
    <Link
      href="https://owlto.finance/bridge?channel=28573"
      target="_blank"
      rel="noopener noreferrer"
      color="inherit"
      underline="none"
      title={t('common.owlto-bridge')}
    >
      <Button className={styles.chainButton} variant="primary" title={t('common.owlto-bridge')}>
        <CurrencyExchangeOutlined />
      </Button>
    </Link>
  );
};
