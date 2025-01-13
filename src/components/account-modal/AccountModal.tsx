import classnames from 'classnames';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Button, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { ExtractSocialPKModal } from 'components/extract-pk-modal/ExtractSocialPKModal';
import { Translate } from 'components/translate/Translate';
import { Separator } from 'components/separator/Separator';
import { Web3AuthDisconnectButton } from 'components/web3auth-connect-button/Web3AuthDisconnectButton';
import { WalletBalances } from 'components/wallet-balances/WalletBalances';
import { WithdrawModal } from 'components/withdraw-modal/WithdrawModal';
import {
  accountModalOpenAtom,
  depositModalOpenAtom,
  extractSocialPKModalOpenAtom,
  withdrawModalOpenAtom,
} from 'store/global-modals.store';
import { gasTokenSymbolAtom } from 'store/pools.store';

import styles from './AccountModal.module.scss';

export const AccountModal = () => {
  const { t } = useTranslation();

  const [isAccountModalOpen, setAccountModalOpen] = useAtom(accountModalOpenAtom);
  const gasTokenSymbol = useAtomValue(gasTokenSymbolAtom);
  const setDepositModalOpen = useSetAtom(depositModalOpenAtom);
  const setWithdrawModalOpen = useSetAtom(withdrawModalOpenAtom);
  const setExtractPKModalOpen = useSetAtom(extractSocialPKModalOpenAtom);

  const handleOnClose = () => setAccountModalOpen(false);

  return (
    <>
      <Dialog
        open={isAccountModalOpen}
        onClose={handleOnClose}
        onCloseClick={handleOnClose}
        className={styles.dialog}
        dialogTitle={t('common.account-modal.title')}
        footerActions={
          <>
            <Button onClick={handleOnClose} variant="secondary" className={styles.actionButton}>
              {t('common.info-modal.close')}
            </Button>
            <Web3AuthDisconnectButton />
          </>
        }
      >
        <div className={classnames(styles.section, styles.buttons)}>
          <Button onClick={() => setDepositModalOpen(true)} variant="primary" className={styles.button}>
            {t('common.account-modal.deposit-button')}
          </Button>
          <Button onClick={() => setWithdrawModalOpen(true)} variant="primary" className={styles.button}>
            {t('common.account-modal.withdraw-button')}
          </Button>
          <Button onClick={() => setExtractPKModalOpen(true)} variant="primary" className={styles.button}>
            {t('common.account-modal.extract-pk-button')}
          </Button>
        </div>
        <Separator />
        <div className={styles.section}>
          <WalletBalances />
          <Typography variant="bodyTiny" className={styles.noteText}>
            <Translate i18nKey="common.account-modal.notice-block" values={{ currencyName: gasTokenSymbol }} />
          </Typography>
        </div>
      </Dialog>

      <ExtractSocialPKModal />
      <WithdrawModal />
    </>
  );
};
