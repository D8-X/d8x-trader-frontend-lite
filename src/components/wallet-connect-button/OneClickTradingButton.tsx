import { useAtom } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@mui/material';

import { FlashIcon } from 'assets/icons/Flash';
import { OneClickTradingModal } from 'components/header/elements/settings-block/components/one-click-trading/components/OneClickTradingModal';
import { activatedOneClickTradingAtom } from 'store/app.store';

import styles from './WalletConnectButton.module.scss';

export const OneClickTradingButton = () => {
  const { t } = useTranslation();

  const [activatedOneClickTrading] = useAtom(activatedOneClickTradingAtom);
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        className={styles.chainButton}
        variant="primary"
        title={t(`common.one-click.${activatedOneClickTrading ? 'disable' : 'enable'}`)}
      >
        <FlashIcon isActive={activatedOneClickTrading} />
      </Button>
      <OneClickTradingModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
