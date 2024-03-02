import { ConnectButton } from '@rainbow-me/rainbowkit';
import classnames from 'classnames';
import { memo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@mui/material';

import styles from './WalletConnectButton.module.scss';

interface WalletConnectButtonPropsI {
  connectButtonLabel?: ReactNode;
  buttonClassName?: string;
}

export const WalletConnectButton = memo((props: WalletConnectButtonPropsI) => {
  const { t } = useTranslation();

  const {
    connectButtonLabel = <span className={styles.cutAddressName}>{t('common.wallet-connect')}</span>,
    buttonClassName,
  } = props;

  return (
    <ConnectButton.Custom>
      {({ account, chain, openChainModal, openConnectModal, mounted }) => {
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

              return null;
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
});
