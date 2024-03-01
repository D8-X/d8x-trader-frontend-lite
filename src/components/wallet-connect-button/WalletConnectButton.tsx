import { ConnectButton } from '@rainbow-me/rainbowkit';
import classnames from 'classnames';
import { useAtomValue } from 'jotai';
import { memo, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AccountBox } from '@mui/icons-material';
import { Button, useMediaQuery, useTheme } from '@mui/material';

import WalletIcon from 'assets/icons/walletIcon.svg?react';
import { config, web3AuthConfig } from 'config';
import { socialPKAtom } from 'store/web3-auth.store';
import { cutAddress } from 'utils/cutAddress';

import { LiFiWidgetButton } from './LiFiWidgetButton';
import { OneClickTradingButton } from './OneClickTradingButton';

import styles from './WalletConnectButton.module.scss';
import { AccountModal } from '../account-modal/AccountModal';

interface WalletConnectButtonPropsI {
  connectButtonLabel?: ReactNode;
  buttonClassName?: string;
}

const isSocialLoginEnabled = web3AuthConfig.web3AuthClientId !== '';

export const WalletConnectButton = memo((props: WalletConnectButtonPropsI) => {
  const { t } = useTranslation();

  const {
    connectButtonLabel = <span className={styles.cutAddressName}>{t('common.wallet-connect')}</span>,
    buttonClassName,
  } = props;

  const [isAccountModalOpen, setAccountModalOpen] = useState(false);

  const socialPK = useAtomValue(socialPKAtom);

  const theme = useTheme();
  const isMobileScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const isSignedInSocially = isSocialLoginEnabled && socialPK != '';

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;

        return (
          <div className={classnames(styles.root, { [styles.connected]: !mounted })} aria-hidden={mounted}>
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    variant="primary"
                    className={classnames(styles.connectWalletButton, buttonClassName)}
                  >
                    {connectButtonLabel}
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button onClick={openChainModal} variant="warning">
                    {t('error.wrong-network')}
                  </Button>
                );
              }

              return (
                <>
                  <div className={styles.buttonsHolder}>
                    {!isSignedInSocially && <OneClickTradingButton />}
                    {config.activateLiFi && <LiFiWidgetButton />}
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
                  {isSignedInSocially && (
                    <AccountModal isOpen={isAccountModalOpen} onClose={() => setAccountModalOpen(false)} />
                  )}
                </>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
});
