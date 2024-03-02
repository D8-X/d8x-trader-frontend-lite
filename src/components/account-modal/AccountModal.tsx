import classnames from 'classnames';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Button, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

import { DepositModal } from 'components/deposit-modal/DepositModal';
import { Dialog } from 'components/dialog/Dialog';
import { Translate } from 'components/translate/Translate';
import { Separator } from 'components/separator/Separator';
import { Web3AuthDisconnectButton } from 'components/web3auth-connect-button/Web3AuthDisconnectButton';
import { WalletBalances } from 'components/wallet-balances/WalletBalances';
import { depositModalOpenAtom, exportPKModalOpenAtom, withdrawModalOpenAtom } from 'store/global-modals.store';
import { gasTokenSymbolAtom } from 'store/pools.store';

import styles from './AccountModal.module.scss';

interface AccountModalPropsI {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountModal = ({ isOpen, onClose }: AccountModalPropsI) => {
  const { t } = useTranslation();

  const gasTokenSymbol = useAtomValue(gasTokenSymbolAtom);
  const setDepositModalOpen = useSetAtom(depositModalOpenAtom);
  const setWithdrawModalOpen = useSetAtom(withdrawModalOpenAtom);
  const setExportPKModalOpen = useSetAtom(exportPKModalOpenAtom);

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} className={styles.dialog}>
        <DialogTitle>{t('common.account-modal.title')}</DialogTitle>
        <DialogContent className={styles.dialogContent}>
          <div className={classnames(styles.section, styles.buttons)}>
            <Button onClick={() => setDepositModalOpen(true)} variant="primary" className={styles.button}>
              {t('common.account-modal.deposit-button')}
            </Button>
            <Button onClick={() => setWithdrawModalOpen(true)} variant="primary" className={styles.button}>
              {t('common.account-modal.withdraw-button')}
            </Button>
            <Button onClick={() => setExportPKModalOpen(true)} variant="primary" className={styles.button}>
              {t('common.account-modal.export-pk-button')}
            </Button>
          </div>
          <Separator />
          <div className={styles.section}>
            <WalletBalances />
            <Typography variant="bodyTiny" className={styles.noteText}>
              <Translate i18nKey="common.account-modal.notice-block" values={{ currencyName: gasTokenSymbol }} />
            </Typography>
          </div>
          <Separator />
        </DialogContent>
        <DialogActions className={styles.dialogAction}>
          <Button onClick={onClose} variant="secondary">
            {t('common.info-modal.close')}
          </Button>
          <Web3AuthDisconnectButton />
        </DialogActions>
      </Dialog>

      <DepositModal />
    </>
  );
};
