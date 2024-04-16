import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { Button, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

import { CopyInput } from 'components/copy-input/CopyInput';
import { CopyLink } from 'components/copy-link/CopyLink';
import { CurrencySelect } from 'components/currency-selector/CurrencySelect';
import { CurrencyItemI } from 'components/currency-selector/types';
import { Dialog } from 'components/dialog/Dialog';
import { Separator } from 'components/separator/Separator';
import { Translate } from 'components/translate/Translate';
import { WalletBalances } from 'components/wallet-balances/WalletBalances';
import { activatedOneClickTradingAtom, tradingClientAtom } from 'store/app.store';
import { depositModalOpenAtom } from 'store/global-modals.store';
import { gasTokenSymbolAtom } from 'store/pools.store';
import { cutAddress } from 'utils/cutAddress';

import { OKXConvertor } from './elements/okx-convertor/OKXConvertor';

import styles from './DepositModal.module.scss';

export const DepositModal = () => {
  const { t } = useTranslation();

  const { address, chain } = useAccount();

  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyItemI>();

  const [isDepositModalOpen, setDepositModalOpen] = useAtom(depositModalOpenAtom);
  const gasTokenSymbol = useAtomValue(gasTokenSymbolAtom);
  const tradingClient = useAtomValue(tradingClientAtom);
  const activatedOneClickTrading = useAtomValue(activatedOneClickTradingAtom);

  const targetAddress = useMemo(() => {
    if (activatedOneClickTrading && selectedCurrency?.isGasToken === false) {
      return address;
    }
    return tradingClient?.account?.address;
  }, [tradingClient?.account?.address, address, activatedOneClickTrading, selectedCurrency]);

  const handleOnClose = useCallback(() => {
    setDepositModalOpen(false);
  }, [setDepositModalOpen]);

  const poolAddress = selectedCurrency?.contractAddress || '';

  return (
    <Dialog open={isDepositModalOpen} onClose={handleOnClose} className={styles.dialog}>
      <DialogTitle>{t('common.deposit-modal.title')}</DialogTitle>
      <DialogContent className={styles.dialogContent}>
        <div className={styles.section}>
          <CurrencySelect selectedCurrency={selectedCurrency} setSelectedCurrency={setSelectedCurrency} />
        </div>
        <Separator />
        <OKXConvertor selectedCurrency={selectedCurrency} />
        <div className={styles.section}>
          <Typography variant="bodyTiny" className={styles.noteText}>
            <Translate
              i18nKey="common.deposit-modal.important-notice.1"
              values={{ currencyName: selectedCurrency?.name }}
            />{' '}
            {poolAddress && (
              <>
                {t('common.deposit-modal.important-notice.2')}
                <CopyLink
                  elementToShow={cutAddress(poolAddress)}
                  textToCopy={poolAddress}
                  classname={styles.copyText}
                />
                {t('common.deposit-modal.important-notice.3')}{' '}
              </>
            )}
            {t('common.deposit-modal.important-notice.4')}{' '}
            <Translate i18nKey="common.deposit-modal.important-notice.5" values={{ chainName: chain?.name }} />
          </Typography>
        </div>
        <div className={styles.section}>
          <CopyInput id="address" textToCopy={targetAddress || ''} />
        </div>
        <Separator />
        <div className={styles.section}>
          <WalletBalances />
          <Typography variant="bodyTiny" className={styles.noteText}>
            <Translate i18nKey="common.deposit-modal.deposit-note" values={{ currencyName: gasTokenSymbol }} />
          </Typography>
        </div>
      </DialogContent>
      <DialogActions className={styles.dialogAction}>
        <Button onClick={handleOnClose} variant="secondary">
          {t('common.deposit-modal.done-button')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
