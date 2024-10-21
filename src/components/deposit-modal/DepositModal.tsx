import classnames from 'classnames';
import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { Typography } from '@mui/material';

import { CopyInput } from 'components/copy-input/CopyInput';
import { CopyLink } from 'components/copy-link/CopyLink';
import { CurrencySelect } from 'components/currency-selector/CurrencySelect';
import { Dialog } from 'components/dialog/Dialog';
import { Separator } from 'components/separator/Separator';
import { Translate } from 'components/translate/Translate';
import { WalletBalances } from 'components/wallet-balances/WalletBalances';
import { isCedeWidgetEnabled } from 'helpers/isCedeWidgetEnabled';
import { isLifiWidgetEnabled } from 'helpers/isLifiWidgetEnabled';
import { isOwltoButtonEnabled } from 'helpers/isOwltoButtonEnabled';
import { useBridgeShownOnPage } from 'helpers/useBridgeShownOnPage';
import { isMockSwapEnabled } from 'helpers/isMockSwapEnabled';
import { activatedOneClickTradingAtom, tradingClientAtom } from 'store/app.store';
import { depositModalOpenAtom, modalSelectedCurrencyAtom } from 'store/global-modals.store';
import { gasTokenSymbolAtom, poolTokenBalanceAtom } from 'store/pools.store';
import { cutAddress } from 'utils/cutAddress';
import { isEnabledChain } from 'utils/isEnabledChain';

import { CedeWidgetButton } from './elements/cede-widget-button/CedeWidgetButton';
import { LiFiWidgetButton } from './elements/lifi-widget-button/LiFiWidgetButton';
import { OKXConvertor } from './elements/okx-convertor/OKXConvertor';
import { OwltoButton } from './elements/owlto-button/OwltoButton';
import { MockSwap } from './elements/mock-swap/MockSwap';

import styles from './DepositModal.module.scss';

export const DepositModal = () => {
  const { t } = useTranslation();

  const { address, chain, chainId } = useAccount();

  const [isDepositModalOpen, setDepositModalOpen] = useAtom(depositModalOpenAtom);
  const selectedCurrency = useAtomValue(modalSelectedCurrencyAtom);
  const gasTokenSymbol = useAtomValue(gasTokenSymbolAtom);
  const tradingClient = useAtomValue(tradingClientAtom);
  const activatedOneClickTrading = useAtomValue(activatedOneClickTradingAtom);
  const poolTokenBalance = useAtomValue(poolTokenBalanceAtom);

  const isBridgeShownOnPage = useBridgeShownOnPage();
  const isOwltoEnabled = isOwltoButtonEnabled(chainId);
  const isLiFiEnabled = isLifiWidgetEnabled(isOwltoEnabled, chainId);
  const isCedeEnabled = isCedeWidgetEnabled(chainId);
  const isMockTokenSwapEnabled = isMockSwapEnabled(chainId);

  const targetAddress = useMemo(() => {
    if (activatedOneClickTrading && selectedCurrency?.isGasToken === false) {
      return address;
    }
    return tradingClient?.account?.address;
  }, [tradingClient?.account?.address, address, activatedOneClickTrading, selectedCurrency]);

  const handleOnClose = useCallback(() => {
    setDepositModalOpen(false);
  }, [setDepositModalOpen]);

  useEffect(() => {
    if (isMockSwapEnabled(chainId) && poolTokenBalance === 0) {
      console.log({ chainId, poolTokenBalance });
      setDepositModalOpen(true);
    }
  }, [chainId, poolTokenBalance, setDepositModalOpen]);

  if (!isEnabledChain(chainId)) {
    return null;
  }

  const poolTokenAddress = selectedCurrency?.contractAddress || '';

  return (
    <Dialog
      open={isDepositModalOpen}
      onClose={handleOnClose}
      onCloseClick={handleOnClose}
      className={styles.dialog}
      dialogTitle={t('common.deposit-modal.title')}
    >
      <div className={styles.section}>
        <CurrencySelect />
      </div>
      <Separator />
      <OKXConvertor />
      <div className={styles.section}>
        {activatedOneClickTrading ? (
          <Typography variant="bodyMedium" className={styles.noteText}>
            {t('common.deposit-modal.important-notice.0')}
          </Typography>
        ) : (
          <div>{/* empty block */}</div>
        )}
        <Typography variant="bodySmall" className={styles.noteText}>
          <Translate
            i18nKey="common.deposit-modal.important-notice.1"
            values={{ currencyName: selectedCurrency?.settleToken }}
          />{' '}
          {poolTokenAddress && (
            <>
              {t('common.deposit-modal.important-notice.2')}
              <CopyLink
                elementToShow={cutAddress(poolTokenAddress)}
                textToCopy={poolTokenAddress}
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
      {(isCedeEnabled || isLiFiEnabled || isOwltoEnabled) && (
        <div className={classnames(styles.section, styles.widgetButtons)}>
          {isBridgeShownOnPage && (isLiFiEnabled || isOwltoEnabled) ? (
            <div>
              {isLiFiEnabled && <LiFiWidgetButton />}
              {isOwltoEnabled && <OwltoButton />}
            </div>
          ) : (
            <div>{/* empty block */}</div>
          )}
          {isCedeEnabled ? <CedeWidgetButton /> : <div>{/* empty block */}</div>}
        </div>
      )}
      {isMockTokenSwapEnabled && !selectedCurrency?.isGasToken && <MockSwap />}
      <Separator />
      <div className={styles.section}>
        <WalletBalances />
        <Typography variant="bodyTiny" className={styles.noteText}>
          <Translate i18nKey="common.deposit-modal.deposit-note" values={{ currencyName: gasTokenSymbol }} />
        </Typography>
      </div>
    </Dialog>
  );
};
