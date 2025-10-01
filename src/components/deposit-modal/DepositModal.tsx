import classnames from 'classnames';
import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { Typography } from '@mui/material';

import { CopyInput } from 'components/copy-input/CopyInput';
import { CopyLink } from 'components/copy-link/CopyLink';
import { CurrencySelect } from 'components/currency-selector/CurrencySelect';
import { Dialog } from 'components/dialog/Dialog';
import { SeparatorTypeE } from 'components/separator/enums';
import { Separator } from 'components/separator/Separator';
import { Translate } from 'components/translate/Translate';
import { WalletBalances } from 'components/wallet-balances/WalletBalances';
import { isCedeWidgetEnabled } from 'helpers/isCedeWidgetEnabled';
import { isMockSwapEnabled } from 'helpers/isMockSwapEnabled';
import { isOwltoButtonEnabled } from 'helpers/isOwltoButtonEnabled';
import { useBridgeShownOnPage } from 'helpers/useBridgeShownOnPage';
import { depositModalOpenAtom, modalSelectedCurrencyAtom } from 'store/global-modals.store';
import { gasTokenSymbolAtom, poolTokenBalanceAtom } from 'store/pools.store';
import { cutAddress } from 'utils/cutAddress';
import { isEnabledChain } from 'utils/isEnabledChain';

import { web3AuthConfig } from 'config';
import { web3AuthIdTokenAtom } from 'store/web3-auth.store';
import { CedeWidgetButton } from './elements/cede-widget-button/CedeWidgetButton';
import { MockSwap } from './elements/mock-swap/MockSwap';
import { OKXConvertor } from './elements/okx-convertor/OKXConvertor';
import { OwltoButton } from './elements/owlto-button/OwltoButton';

import { useUserWallet } from 'context/user-wallet-context/UserWalletContext';
import { smartAccountClientAtom } from 'store/app.store';
import { MethodE } from 'types/enums';
import styles from './DepositModal.module.scss';

export const DepositModal = () => {
  const { t } = useTranslation();

  const { address, chain, chainId } = useAccount();

  const [isDepositModalOpen, setDepositModalOpen] = useAtom(depositModalOpenAtom);
  const selectedCurrency = useAtomValue(modalSelectedCurrencyAtom);
  const gasTokenSymbol = useAtomValue(gasTokenSymbolAtom);
  const poolTokenBalance = useAtomValue(poolTokenBalanceAtom);
  const smartAccountClient = useAtomValue(smartAccountClientAtom);

  const isBridgeShownOnPage = useBridgeShownOnPage();
  const isOwltoEnabled = isOwltoButtonEnabled(chainId);
  const isCedeEnabled = isCedeWidgetEnabled(chainId);
  const isMockTokenSwapEnabled = isMockSwapEnabled(chainId);
  const { gasTokenBalance, hasEnoughGasForFee } = useUserWallet();
  const web3authIdToken = useAtomValue(web3AuthIdTokenAtom);
  const isSignedInSocially = web3AuthConfig.isEnabled && web3authIdToken != '';

  const [title, setTitle] = useState('');

  const targetAddress = useMemo(() => {
    return smartAccountClient?.account?.address || address;
  }, [smartAccountClient, address]);

  const handleOnClose = useCallback(() => {
    setDepositModalOpen(false);
  }, [setDepositModalOpen]);

  useEffect(() => {
    if (
      isMockSwapEnabled(chainId) &&
      (poolTokenBalance === 0 || (gasTokenBalance && !hasEnoughGasForFee(MethodE.Interact, 1n)))
    ) {
      setTitle('Get Test Tokens');
      setDepositModalOpen(true);
    } else if (!isSignedInSocially) {
      setTitle(t('common.deposit-modal.title-web3wallet'));
    } else {
      setTitle(t('common.deposit-modal.title'));
    }
  }, [chainId, poolTokenBalance, gasTokenBalance, hasEnoughGasForFee, setDepositModalOpen, t, isSignedInSocially]);

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
      dialogTitle={title}
    >
      {isSignedInSocially || isMockSwapEnabled(chainId) ? (
        <>
          <div className={styles.section}>
            <CurrencySelect />
          </div>
          <Separator separatorType={SeparatorTypeE.Modal} />
          <OKXConvertor />
          {!isMockSwapEnabled(chainId) ? (
            <div className={styles.section}>
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
              <div className={styles.section}>
                <CopyInput id="address" textToCopy={targetAddress || ''} />
              </div>
            </div>
          ) : (
            <div className={styles.section}>
              <Typography variant="bodyMedium" className={styles.noteText}>
                {`You need test tokens to trade`}
              </Typography>
            </div>
          )}

          {(isCedeEnabled || isOwltoEnabled) && (
            <div className={classnames(styles.section, styles.widgetButtons)}>
              {isBridgeShownOnPage && isOwltoEnabled ? (
                <div>{isOwltoEnabled && <OwltoButton />}</div>
              ) : (
                <div>{/* empty block */}</div>
              )}
              {isCedeEnabled ? <CedeWidgetButton /> : <div>{/* empty block */}</div>}
            </div>
          )}
          {isMockTokenSwapEnabled && (
            <div>
              <MockSwap />
            </div>
          )}
          <Separator separatorType={SeparatorTypeE.Modal} />
        </>
      ) : (
        <>
          <Typography variant="bodyMedium" className={styles.noteText}>
            <Translate i18nKey="common.deposit-modal.deposit-note" values={{ currencyName: gasTokenSymbol }} />
          </Typography>
          <Separator separatorType={SeparatorTypeE.Modal} />
        </>
      )}
      <div className={styles.section}>
        <Typography variant="bodyMedium">
          <Translate i18nKey="pages.trade.order-block.info.balance" values={{ currencyName: gasTokenSymbol }} />:
        </Typography>
        <WalletBalances />
      </div>
    </Dialog>
  );
};
