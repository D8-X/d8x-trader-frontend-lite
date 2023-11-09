import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@mui/material';

import { ReactComponent as SwitchIcon } from 'assets/icons/switchSeparator.svg';
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
        <SwitchIcon width={40} height={40} />
      </Button>
      <LiFiWidgetModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
