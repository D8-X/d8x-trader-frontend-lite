import { ConnectButton } from '@rainbow-me/rainbowkit';
import classnames from 'classnames';
import { memo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { config } from 'config';
import { useWeb3Auth } from 'context/web3-auth-context/Web3AuthContext';

import { WrongNetworkButton } from './WrongNetworkButton';

import styles from './WalletConnectButton.module.scss';
import { WalletConnectButton } from './WalletConnectButton';

interface WalletConnectButtonHolderPropsI {
  connectButtonLabel?: ReactNode;
  buttonClassName?: string;
}

export const WalletConnectButtonHolder = memo((props: WalletConnectButtonHolderPropsI) => {
  const { t } = useTranslation();

  const { isConnecting } = useWeb3Auth();

  const {
    connectButtonLabel = <span className={styles.cutAddressName}>{t('common.wallet-connect')}</span>,
    buttonClassName,
  } = props;

  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted }) => {
        const connected = mounted && account && chain;

        const isVisibleChain = chain && config.enabledChains.includes(chain.id);

        return (
          <div className={classnames(styles.root, { [styles.connected]: !mounted })} aria-hidden={mounted}>
            {(() => {
              if (!connected) {
                return (
                  <WalletConnectButton
                    label={connectButtonLabel}
                    className={classnames(styles.connectWalletButton, buttonClassName)}
                    disabled={isConnecting}
                  />
                );
              }

              if (chain.unsupported || !isVisibleChain) {
                return <WrongNetworkButton />;
              }

              return null;
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
});
