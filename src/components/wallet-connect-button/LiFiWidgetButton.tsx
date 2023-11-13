import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import CurrencyExchangeOutlinedIcon from '@mui/icons-material/CurrencyExchangeOutlined';
import { Button } from '@mui/material';
import { LiFiWidgetModal } from 'components/li-fi-widget-modal/LiFiWidgetModal';

import styles from './WalletConnectButton.module.scss';

export const LiFiWidgetButton = () => {
  const { t } = useTranslation();

  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        className={styles.chainButton}
        variant="primary"
        title={t('common.li-fi-widget')}
      >
        <CurrencyExchangeOutlinedIcon />
      </Button>
      <LiFiWidgetModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
