import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { CurrencyExchangeOutlined } from '@mui/icons-material';
import { Button } from '@mui/material';

import { lifiModalOpenAtom } from 'store/global-modals.store';

import styles from './WalletConnectButton.module.scss';

export const LiFiWidgetButton = () => {
  const { t } = useTranslation();

  const setModalOpen = useSetAtom(lifiModalOpenAtom);

  return (
    <Button
      onClick={() => setModalOpen(true)}
      className={styles.chainButton}
      variant="primary"
      title={t('common.li-fi-widget.button-title')}
    >
      <CurrencyExchangeOutlined />
    </Button>
  );
};
