import { memo } from 'react';

import { Button } from '@mui/material';

import styles from './Web3AuthConnectButton.module.scss';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import classnames from 'classnames';
import { useSetAtom } from 'jotai';
import { socialUserInfoAtom } from 'store/app.store';
interface Web3AuthConnectButtonPropsI {
  buttonClassName?: string;
}

export const Web3AuthConnectButton = memo(({ buttonClassName }: Web3AuthConnectButtonPropsI) => {
  const { isConnected } = useAccount();
  const { connect, connectors, error } = useConnect();
  const { disconnect } = useDisconnect();
  const setUserInfo = useSetAtom(socialUserInfoAtom);

  const handleDisconnect = () => {
    setUserInfo(null);
    disconnect();
  };

  if (isConnected) {
    return (
      isConnected && (
        <Button
          className={classnames(styles.connectWalletButton, buttonClassName)}
          onClick={handleDisconnect}
          variant="primary"
        >
          Disconnect
        </Button>
      )
    );
  } else {
    return (
      <div className="main">
        {connectors
          .filter((c) => c.name === 'Web3Auth')
          .map((c) => {
            return (
              <Button
                className={classnames(styles.connectWalletButton, buttonClassName)}
                key={c.id}
                onClick={() => connect({ connector: c })}
                variant="primary"
              >
                {c.name}
              </Button>
            );
          })}
        {error && <div>{error.message}</div>}
      </div>
    );
  }

  // return (
  //   <Button
  //     onClick={() => {
  //       isConnected ? disconnect() : connect({ connector });
  //     }}
  //     className={styles.chainButton}
  //     variant="primary"
  //     title={isConnected ? 'Disconnect' : 'Connect'}
  //   >
  //     {isConnected ? address : 'Twitter'}
  //   </Button>
  // );
});
