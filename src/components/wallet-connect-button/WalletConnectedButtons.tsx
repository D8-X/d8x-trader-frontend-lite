import { ConnectButton } from '@rainbow-me/rainbowkit';
import classnames from 'classnames';
import { useAtomValue, useSetAtom } from 'jotai';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { AccountBox } from '@mui/icons-material';
import { Button, useMediaQuery, useTheme } from '@mui/material';

import WalletIcon from 'assets/icons/walletIcon.svg?react';
import { config, web3AuthConfig } from 'config';
import { AccountModal } from 'components/account-modal/AccountModal';
import { isOwltoButtonEnabled } from 'helpers/isOwltoButtonEnabled';
import { useBridgeShownOnPage } from 'helpers/useBridgeShownOnPage';
import { accountModalOpenAtom } from 'store/global-modals.store';
import { web3AuthIdTokenAtom } from 'store/web3-auth.store';
import { cutAddress } from 'utils/cutAddress';

import { OneClickTradingButton } from './OneClickTradingButton';
import { OwltoButton } from './OwltoButton';

import styles from './WalletConnectButton.module.scss';

interface WalletConnectedButtonsPropsI {
  mobile?: boolean;
}

export const WalletConnectedButtons = memo(({ mobile = false }: WalletConnectedButtonsPropsI) => {
  const { t } = useTranslation();

  const setAccountModalOpen = useSetAtom(accountModalOpenAtom);
  const web3authIdToken = useAtomValue(web3AuthIdTokenAtom);

  const { chainId } = useAccount();

  const theme = useTheme();
  const isMobileScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const isSignedInSocially = web3AuthConfig.isEnabled && web3authIdToken != '';

  const isBridgeShownOnPage = useBridgeShownOnPage();
  const isOwltoEnabled = isOwltoButtonEnabled(chainId);

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, mounted }) => {
        const connected = mounted && account && chain;

        const isVisibleChain = chain && config.enabledChains.includes(chain.id);

        return (
          <div className={classnames(styles.root, { [styles.connected]: !mounted })} aria-hidden={mounted}>
            {(() => {
              if (!connected || chain.unsupported || !isVisibleChain) {
                return null;
              }

              return (
                <>
                  <div className={styles.buttonsHolder}>
                    {!isSignedInSocially && !mobile && <OneClickTradingButton />}
                    {isOwltoEnabled && isBridgeShownOnPage && !mobile && <OwltoButton />}
                    <Button onClick={openChainModal} className={styles.chainButton} variant="primary">
                      <img src={chain.iconUrl} alt={chain.name} title={chain.name} />
                    </Button>
                    {!isSignedInSocially && (
                      <Button onClick={openAccountModal} variant="primary" className={styles.addressButton}>
                        {!isMobileScreen && (
                          <span className={styles.cutAddressName}>{cutAddress(account.address)}</span>
                        )}
                        {isMobileScreen && <WalletIcon className={styles.icon} />}
                      </Button>
                    )}
                    {isSignedInSocially && (
                      <Button
                        onClick={() => setAccountModalOpen(true)}
                        variant="primary"
                        className={styles.addressButton}
                      >
                        {!isMobileScreen && <span className={styles.cutAddressName}>{t('common.account-button')}</span>}
                        {isMobileScreen && <AccountBox className={styles.icon} />}
                      </Button>
                    )}
                  </div>
                  {isSignedInSocially && <AccountModal />}
                </>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
});
