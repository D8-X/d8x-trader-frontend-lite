import { useAtom } from 'jotai';
import { useState } from 'react';

import { Button } from '@mui/material';

import { FlashIcon } from 'assets/icons/Flash';
import { OneClickTradingModal } from 'components/header/elements/settings-block/components/one-click-trading/components/OneClickTradingModal';
import { activatedOneClickTradingAtom } from 'store/app.store';

import styles from './WalletConnectButton.module.scss';

export const OneClickTradingButton = () => {
  const [activatedOneClickTrading] = useAtom(activatedOneClickTradingAtom);
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        className={styles.chainButton}
        variant="primary"
        title={activatedOneClickTrading ? 'Disable one-click trading' : 'Enable one-click trading'}
      >
        <FlashIcon isActive={activatedOneClickTrading} />
      </Button>
      <OneClickTradingModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
