import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Button } from '@mui/material';

import { FlashIcon } from 'assets/icons/Flash';
import { activatedOneClickTradingAtom } from 'store/app.store';
import { oneClickModalOpenAtom } from 'store/global-modals.store';

import styles from './WalletConnectButton.module.scss';

export const OneClickTradingButton = () => {
  const { t } = useTranslation();

  const activatedOneClickTrading = useAtomValue(activatedOneClickTradingAtom);
  const setOneClickModalOpen = useSetAtom(oneClickModalOpenAtom);

  return (
    <Button
      onClick={() => setOneClickModalOpen(true)}
      className={styles.chainButton}
      variant="primary"
      title={t(`common.one-click.${activatedOneClickTrading ? 'disable' : 'enable'}`)}
    >
      <FlashIcon isActive={activatedOneClickTrading} />
    </Button>
  );
};
